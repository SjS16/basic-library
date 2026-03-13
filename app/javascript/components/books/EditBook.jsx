import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getAuthHeaders } from "../../utils/csrf";
import { useOpenLibrarySearch } from "../../hooks/useOpenLibrarySearch";
import { fetchBookDetails, fetchBookByISBN } from "../../utils/openLibraryApi";
import SearchResults from "./SearchResults";
import BookForm from "./BookForm";
import BarcodeScanner from "./BarcodeScanner";

function EditBook() {
  const [book, setBook] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [scanError, setScanError] = useState(null);
  const navigate = useNavigate();
  const { id } = useParams();
  const { searchResults, clearResults } = useOpenLibrarySearch(searchTerm);

  const pageHeading = id ? "Edit Book" : "Add New Book";

  useEffect(() => {
    if (id) {
      fetch(`/books/${id}.json`)
        .then((res) => res.json())
        .then((data) => setBook(data))
        .catch((err) => console.error("Error fetching book:", err));
    }
  }, [id]);

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

    fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify({ book }),
    })
      .then((res) => res.json())
      .then(() => {
        alert(`Book ${book.id ? "updated" : "created"} successfully!`);
        navigate("/books");
      })
      .catch((err) => console.error("Error saving book:", err));
  };

  return (
    <div className="p-4 sm:p-6 bg-white rounded shadow max-w-2xl mx-auto">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">{pageHeading}</h1>

      {/* Scan Error Message */}
      {scanError && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm">{scanError}</p>
        </div>
      )}

      {/* Scan Barcode Button */}
      {!id && (
        <button
          onClick={() => setShowScanner(true)}
          className="w-full mb-4 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 shadow-lg transition-all flex items-center justify-center gap-2 text-sm sm:text-base font-medium"
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
          className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base bg-blue-600 text-white rounded hover:bg-blue-700"
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