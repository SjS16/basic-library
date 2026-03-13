import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getAuthHeaders } from "../../utils/csrf";
import { useOpenLibrarySearch } from "../../hooks/useOpenLibrarySearch";
import { fetchBookDetails } from "../../utils/openLibraryApi";
import SearchResults from "./SearchResults";
import BookForm from "./BookForm";

function EditBook() {
  const [book, setBook] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
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
    <div className="p-6 bg-white rounded shadow max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{pageHeading}</h1>

      <label className="block text-gray-700 mb-1">Title:</label>
      <input
        type="text"
        value={book.title || ""}
        onChange={(e) => handleTitleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full p-2 border rounded mb-2"
        placeholder="Start typing to search Open Library..."
      />

      <SearchResults 
        results={searchResults} 
        onSelect={handleSelectBook}
        onDismiss={handleDismissSearch}
      />

      <BookForm book={book} onChange={setBook} />

      <div className="flex justify-end gap-3">
        <button
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          onClick={() => navigate("/books")}
        >
          Cancel
        </button>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={saveBook}
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}

export default EditBook;