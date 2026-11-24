import React, { useState } from "react";
import { Link } from "react-router-dom";
import { getAuthHeaders } from "../../utils/csrf";
import { fetchBookDetails, fetchBookByISBN } from "../../utils/openLibraryApi";

// Owner-only bulk import. Pick a CSV with Title and Author columns
// (Edition and ISBN are optional). Each row is enriched from Open
// Library (cover, description, year, genre, ISBN) and then created
// through the normal book endpoint, so the wishlist-claim and
// duplicate rules apply exactly as if it had been added by hand.
// The CSV's own title and author always win; Open Library only
// fills in the details around them.

// Small quote-aware CSV parser: handles commas inside quoted
// fields and doubled quotes.
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field); field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
    } else field += ch;
  }
  row.push(field);
  if (row.length > 1 || row[0] !== "") rows.push(row);
  return rows;
}

function rowsFromCSV(text) {
  const rows = parseCSV(text);
  if (rows.length < 2) return [];
  const headers = rows[0].map((h) => h.trim().toLowerCase());
  const col = (name) => headers.indexOf(name);
  const titleI = col("title"), authorI = col("author"), editionI = col("edition"), isbnI = col("isbn");
  if (titleI === -1) return [];
  return rows.slice(1)
    .map((r) => ({
      title: (r[titleI] || "").trim(),
      author: authorI >= 0 ? (r[authorI] || "").trim() : "",
      edition: editionI >= 0 ? (r[editionI] || "").trim() : "",
      isbn: isbnI >= 0 ? (r[isbnI] || "").trim() : "",
    }))
    .filter((r) => r.title !== "");
}

async function enrich(row) {
  try {
    if (row.isbn) {
      const details = await fetchBookByISBN(row.isbn);
      return { ...details, isbn: row.isbn };
    }
    const params = new URLSearchParams({ title: row.title, limit: "1" });
    if (row.author) params.set("author", row.author);
    const res = await fetch(`https://openlibrary.org/search.json?${params}`);
    const data = await res.json();
    if (data.docs && data.docs[0]) return await fetchBookDetails(data.docs[0]);
  } catch (err) {
    console.error("Open Library lookup failed for", row.title, err);
  }
  return null;
}

function ImportBooks() {
  const [rows, setRows] = useState(null);
  const [results, setResults] = useState([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    setRows(rowsFromCSV(text));
    setResults([]);
    setDone(false);
  };

  const runImport = async () => {
    setRunning(true);
    const out = [];
    for (const row of rows) {
      const details = await enrich(row);
      const book = {
        title: row.title,
        author: row.author,
        edition: row.edition,
        isbn: row.isbn || details?.isbn || "",
        published_year: details?.published_year || "",
        description: details?.description || "",
        cover_url: details?.cover_url || null,
        genre: details?.genre || "",
        available: true,
      };
      let status;
      try {
        const res = await fetch("/books.json", {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({ book }),
        });
        if (res.ok) {
          status = details ? "Added, with Open Library details" : "Added (no Open Library match)";
        } else {
          const data = await res.json().catch(() => ({}));
          const messages = Object.values(data).flat().join(" ");
          status = messages.includes("already in the library")
            ? "Skipped, already in the library"
            : `Failed: ${messages || `error ${res.status}`}`;
        }
      } catch (err) {
        status = "Failed: network error";
      }
      out.push({ ...row, status });
      setResults([...out]);
      // A short pause between rows keeps us polite with Open Library.
      await new Promise((r) => setTimeout(r, 150));
    }
    setRunning(false);
    setDone(true);
  };

  const added = results.filter((r) => r.status.startsWith("Added")).length;
  const skipped = results.filter((r) => r.status.startsWith("Skipped")).length;
  const failed = results.filter((r) => r.status.startsWith("Failed")).length;

  return (
    <div className="p-4 sm:p-6 bg-white rounded shadow max-w-3xl mx-auto">
      <h1 className="text-xl sm:text-2xl font-bold mb-2">Import Books from CSV</h1>
      <p className="text-sm text-gray-600 mb-4">
        The file needs a <strong>Title</strong> column and an <strong>Author</strong> column;
        <strong> Edition</strong> and <strong>ISBN</strong> columns are optional. Each book is looked up
        on Open Library for its cover, description, year, genre and ISBN before it is added.
        Books already in the library are skipped, and a second copy is kept only when its
        edition note differs.
      </p>

      <input
        type="file"
        accept=".csv,text/csv"
        onChange={handleFile}
        className="block w-full text-sm mb-4"
      />

      {rows && rows.length === 0 && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-300 rounded-lg">
          <p className="text-amber-800 text-sm font-medium">No book rows found. Check the file has a Title header in the first row.</p>
        </div>
      )}

      {rows && rows.length > 0 && (
        <>
          <p className="text-sm text-gray-700 mb-2">
            Found <strong>{rows.length}</strong> books. First few: {rows.slice(0, 3).map((r) => r.title).join("; ")}{rows.length > 3 ? "…" : ""}
          </p>
          <button
            onClick={runImport}
            disabled={running}
            className="px-4 py-2 text-sm sm:text-base bg-amber-800 text-amber-50 rounded hover:bg-amber-900 disabled:opacity-50 mb-4"
          >
            {running ? `Importing… ${results.length} of ${rows.length}` : `Import ${rows.length} books`}
          </button>
        </>
      )}

      {results.length > 0 && (
        <div className="space-y-1">
          {results.map((r, i) => (
            <div key={i} className="flex items-baseline justify-between gap-3 text-sm border-b border-gray-100 py-1">
              <span className="min-w-0">
                <span className="font-medium">{r.title}</span>
                {r.author && <span className="text-gray-500"> — {r.author}</span>}
                {r.edition && <span className="text-gray-500"> ({r.edition})</span>}
              </span>
              <span className={
                r.status.startsWith("Added") ? "text-green-700 whitespace-nowrap" :
                r.status.startsWith("Skipped") ? "text-amber-700 whitespace-nowrap" : "text-red-700 whitespace-nowrap"
              }>{r.status}</span>
            </div>
          ))}
        </div>
      )}

      {done && (
        <p className="mt-4 text-sm font-medium">
          Done: {added} added, {skipped} skipped, {failed} failed.{" "}
          <Link to="/books" className="text-amber-900 underline">Back to the library</Link>
        </p>
      )}
    </div>
  );
}

export default ImportBooks;
