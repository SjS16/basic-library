import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getAuthHeaders } from "../../utils/csrf";
import { useOpenLibrarySearch } from "../../hooks/useOpenLibrarySearch";
import { fetchBookDetails, fetchBookByISBN, fetchBookByTitleAuthor } from "../../utils/openLibraryApi";
import SearchResults from "./SearchResults";
import BookForm from "./BookForm";
import BarcodeScanner from "./BarcodeScanner";

function EditBook() {
  const [book, setBook] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [scanError, setScanError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const navigate = useNavigate();
  const { id } = useParams();
  const { searchResults, clearResults } = useOpenLibrarySearch(searchTerm);

  const pageHeading = id ? "Edit Book" : "Add New Book";

  const [olSuggestion, setOlSuggestion] = useState(null);
  const [olNote, setOlNote] = useState(null);
  const [olChecking, setOlChecking] = useState(false);
  const olCheckedForId = useRef(null);

  useEffect(() => {
    if (id) {
      fetch(`/books/${id}.json`)
        .then((res) => res.json())
        .then((data) => setBook(data))
        .catch((err) => console.error("Error fetching book:", err));
    }
  }, [id]);

  // Fields Open Library is allowed to fill in on the edit page.
  // It only ever adds to blanks; it never overwrites what's here.
  const FILLABLE_FIELDS = [
    ["cover_url", "a cover image"],
    ["description", "a description"],
    ["published_year", "the published year"],
    ["genre", "a genre"],
    ["isbn", "an ISBN"],
  ];

  const fillableFrom = (suggestion, current) =>
    FILLABLE_FIELDS.filter(([field]) => suggestion?.[field] && !current?.[field]);

  const checkOpenLibrary = async (current, { quiet = true } = {}) => {
    if (!current?.title) return;
    setOlChecking(true);
    try {
      let details = null;
      if (current.isbn) {
        details = await fetchBookByISBN(current.isbn).catch(() => null);
      }
      if (!details || fillableFrom(details, current).length === 0) {
        const bySearch = await fetchBookByTitleAuthor(current.title, current.author).catch(() => null);
        if (bySearch && fillableFrom(bySearch, current).length > 0) details = bySearch;
      }
      if (details && fillableFrom(details, current).length > 0) {
        setOlSuggestion(details);
        setOlNote(null);
      } else {
        setOlSuggestion(null);
        if (!quiet) setOlNote("Open Library has nothing extra for this book.");
      }
    } catch (err) {
      if (!quiet) setOlNote("The Open Library check failed. Try again in a moment.");
    } finally {
      setOlChecking(false);
    }
  };

  // Check once, as soon as an existing book loads.
  useEffect(() => {
    if (id && book.id && olCheckedForId.current !== book.id) {
      olCheckedForId.current = book.id;
      checkOpenLibrary(book);
    }
  }, [id, book.id]);

  const applySuggestion = () => {
    if (!olSuggestion) return;
    setBook((prev) => {
      const merged = { ...prev };
      fillableFrom(olSuggestion, prev).forEach(([field]) => {
        merged[field] = olSuggestion[field];
      });
      return merged;
    });
    setOlSuggestion(null);
  };

  const handleTitleChange = (value) => {
    setBook({ ...book, title: value });
    setSearchTerm(value);
  };

  const handleSelectBook = async (result) => {
    const bookDetails = await fetchBookDetails(result);
    setBook({ ...book, ...bookDetails });
    clearResults();
    setSearchTerm("");
  };

  const handleDismissSearch = () => {
    clearResults();
    setSearchTerm("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      handleDismissSearch();
    }
  };

  const handleScanBarcode = async (barcode) => {
    try {
      setScanError(null);
      setShowScanner(false);
      
      // Show loading message
      alert("Looking up book by ISBN...");
      
      const bookDetails = await fetchBookByISBN(barcode);
      setBook({ ...book, ...bookDetails });
      alert("Book found! Details have been filled in.");
    } catch (error) {
      console.error("ISBN lookup failed:", error);
      setScanError("Could not find book with that ISBN. Try entering details manually.");
      setTimeout(() => setScanError(null), 5000);
    }
  };

  const saveBook = () => {
    const method = book.id ? "PUT" : "POST";
    const url = book.id ? `/books/${book.id}.json` : "/books.json";

    setSaveError(null);

    fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify({ book }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const messages = Object.values(data).flat();
          if (messages.some((m) => m.includes("already in the library"))) {
            throw new Error(
              `"${book.title}" by ${book.author} is already in your library. No duplicate was added.`
            );
          }
          throw new Error(
            Object.entries(data)
              .flatMap(([field, errs]) => errs.map((e) => `${field} ${e}`))
              .join(". ") || "Could not save the book."
          );
        }
        return data;
      })
      .then(() => {
        alert(`Book ${book.id ? "updated" : "created"} successfully!`);
        navigate("/books");
      })
      .catch((err) => {
        console.error("Error saving book:", err);
        setSaveError(err.message);
      });
  };

  const olFillable = olSuggestion ? fillableFrom(olSuggestion, book) : [];

  return (
    <div className="p-4 sm:p-6 bg-white rounded shadow max-w-2xl mx-auto">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">{pageHeading}</h1>

      {/* Scan Error Message */}
      {scanError && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm">{scanError}</p>
        </div>
      )}

      {/* Save Error Message (including duplicates) */}
      {saveError && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-300 rounded-lg">
          <p className="text-amber-800 text-sm font-medium">{saveError}</p>
        </div>
      )}

      {/* Open Library enrichment for existing books: offers to fill
          blank fields and never overwrites anything already entered. */}
      {id && olFillable.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex gap-3">
          {olSuggestion.cover_url && !book.cover_url && (
            <img src={olSuggestion.cover_url} alt="" className="w-12 self-start rounded shadow" />
          )}
          <div className="flex-1">
            <p className="text-sm text-blue-900 font-medium">Open Library has more for this book</p>
            <p className="text-sm text-blue-800">
              It can add {olFillable.map(([, label]) => label).join(", ")}. Nothing you already have will be overwritten.
            </p>
            <div className="flex gap-2 mt-2">
              <button onClick={applySuggestion} className="px-3 py-1.5 bg-amber-800 text-amber-50 rounded text-sm hover:bg-amber-900">
                Add missing details
              </button>
              <button onClick={() => setOlSuggestion(null)} className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50">
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
      {id && olFillable.length === 0 && (
        <div className="mb-4">
          <button
            onClick={() => checkOpenLibrary(book, { quiet: false })}
            disabled={olChecking}
            className="text-sm text-amber-800 underline hover:text-amber-900 disabled:opacity-50"
          >
            {olChecking ? "Checking Open Library…" : "Check Open Library for a cover and more details"}
          </button>
          {olNote && <p className="text-sm text-gray-500 mt-1">{olNote}</p>}
        </div>
      )}

      {/* Scan Barcode Button */}
      {!id && (
        <button
          onClick={() => setShowScanner(true)}
          className="w-full mb-4 px-4 py-3 bg-gradient-to-r from-amber-800 to-amber-900 text-amber-50 rounded-lg hover:from-amber-900 hover:to-amber-950 shadow-lg transition-all flex items-center justify-center gap-2 text-sm sm:text-base font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
          Scan Book Barcode
        </button>
      )}

      <label className="block text-xs sm:text-sm text-gray-700 mb-1">Title:</label>
      <input
        type="text"
        value={book.title || ""}
        onChange={(e) => handleTitleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full p-2 text-sm sm:text-base border rounded mb-2"
        placeholder="Start typing to search Open Library..."
      />

      <SearchResults 
        results={searchResults} 
        onSelect={handleSelectBook}
        onDismiss={handleDismissSearch}
      />

      <BookForm book={book} onChange={setBook} />

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 mt-4 sm:mt-6">
        <button
          className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          onClick={() => navigate("/books")}
        >
          Cancel
        </button>
        <button
          className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base bg-amber-800 text-amber-50 rounded hover:bg-amber-900"
          onClick={saveBook}
        >
          Save Changes
        </button>
      </div>

      {/* Barcode Scanner Modal */}
      {showScanner && (
        <BarcodeScanner
          onScan={handleScanBarcode}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}

export default EditBook;