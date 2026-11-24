import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { getAuthHeaders } from "../../utils/csrf";
import { findEnrichment, enrichableFields } from "../../utils/openLibraryApi";

// A book is a sweep candidate when any of these is blank. The sweep
// fills blanks only; it never overwrites what's already entered.
const FIELDS = ["cover_url", "description", "published_year", "genre", "isbn"];
const FIELD_LABELS = {
  cover_url: "cover",
  description: "description",
  published_year: "year",
  genre: "genre",
  isbn: "ISBN",
};

const missingFields = (book) => FIELDS.filter((f) => !book[f]);

function EnrichBooks() {
  const [books, setBooks] = useState(null);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState([]);
  const [checked, setChecked] = useState(0);
  const [runTotal, setRunTotal] = useState(0);
  const stopRef = useRef(false);

  useEffect(() => {
    fetch("/books.json")
      .then((res) => res.json())
      .then((data) => setBooks(data))
      .catch((err) => console.error("Error fetching books:", err));
  }, []);

  const libraryBooks = (books || []).filter((b) => b.in_library !== false);
  const candidates = libraryBooks.filter((b) => missingFields(b).length > 0);
  const filled = results.filter((r) => r.status === "filled").length;
  const nothing = results.filter((r) => r.status === "nothing").length;
  const failed = results.filter((r) => r.status === "failed").length;

  const addResult = (result) => setResults((prev) => [...prev, result]);

  const runSweep = async () => {
    const queue = candidates;
    setRunning(true);
    stopRef.current = false;
    setResults([]);
    setChecked(0);
    setRunTotal(queue.length);

    for (const book of queue) {
      if (stopRef.current) break;
      try {
        const details = await findEnrichment(book);
        if (!details) {
          addResult({ id: book.id, title: book.title, status: "nothing", text: "Nothing new found" });
        } else {
          const fields = enrichableFields(details, book).map(([field]) => field);
          const updated = { ...book };
          fields.forEach((field) => { updated[field] = details[field]; });
          const res = await fetch(`/books/${book.id}.json`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify({ book: updated }),
          });
          if (res.ok) {
            const saved = await res.json().catch(() => updated);
            setBooks((prev) => prev.map((b) => (b.id === book.id ? { ...b, ...saved } : b)));
            addResult({ id: book.id, title: book.title, status: "filled", text: `Added ${fields.map((f) => FIELD_LABELS[f]).join(", ")}` });
          } else {
            const data = await res.json().catch(() => ({}));
            const message = Object.values(data).flat().join(", ") || "Save failed";
            addResult({ id: book.id, title: book.title, status: "failed", text: message });
          }
        }
      } catch (err) {
        addResult({ id: book.id, title: book.title, status: "failed", text: "Lookup failed" });
      }
      setChecked((n) => n + 1);
      // A short pause between books keeps us polite with Open Library.
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    setRunning(false);
  };

  return (
    <div className="p-4 sm:p-6 bg-white rounded shadow max-w-3xl mx-auto">
      <h1 className="text-xl sm:text-2xl font-bold mb-2">Fill Missing Details</h1>
      <p className="text-sm text-gray-600 mb-4">
        Checks every book that's missing a cover, description, published year, genre, or ISBN
        against Open Library and fills in only the blanks. Nothing already entered is ever overwritten.
      </p>

      {books === null ? (
        <p className="text-sm text-gray-500">Loading your books…</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 mb-4 text-center">
            <div className="bg-amber-50 rounded-lg p-3">
              <p className="text-2xl font-bold text-gray-900">{libraryBooks.length}</p>
              <p className="text-xs text-gray-600">Books in the library</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-3">
              <p className="text-2xl font-bold text-gray-900">{libraryBooks.length - candidates.length}</p>
              <p className="text-xs text-gray-600">Already complete</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-3">
              <p className="text-2xl font-bold text-gray-900">{candidates.length}</p>
              <p className="text-xs text-gray-600">To check</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-4">
            <button
              onClick={runSweep}
              disabled={running || candidates.length === 0}
              className="px-4 py-2 bg-amber-800 text-amber-50 rounded-lg hover:bg-amber-900 text-sm font-medium disabled:bg-gray-300"
            >
              {running ? `Checking ${checked} of ${runTotal}…` : `Check ${candidates.length} book${candidates.length === 1 ? "" : "s"}`}
            </button>
            {running && (
              <button
                onClick={() => { stopRef.current = true; }}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
              >
                Stop
              </button>
            )}
            {!running && results.length > 0 && (
              <p className="text-sm text-gray-600">
                {filled} filled · {nothing} nothing new · {failed} failed
              </p>
            )}
          </div>

          {candidates.length === 0 && !running && results.length === 0 && (
            <p className="text-sm text-green-700">
              Every book already has a cover, description, year, genre, and ISBN. Nothing to do.
            </p>
          )}

          {results.length > 0 && (
            <ul className="divide-y divide-gray-100 border rounded-lg max-h-96 overflow-y-auto">
              {results.map((r) => (
                <li key={r.id} className="px-3 py-2 text-sm flex gap-2">
                  <span>{r.status === "filled" ? "✓" : r.status === "failed" ? "✗" : "·"}</span>
                  <span className="font-medium text-gray-900">{r.title}</span>
                  <span className={r.status === "failed" ? "text-red-700" : "text-gray-500"}>{r.text}</span>
                </li>
              ))}
            </ul>
          )}

          <p className="mt-4 text-sm">
            <Link to="/books" className="text-amber-800 underline hover:text-amber-900">← Back to the catalogue</Link>
          </p>
        </>
      )}
    </div>
  );
}

export default EnrichBooks;
