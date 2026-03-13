import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Search from "../books/bookListHelpers/Search";
import BookFilter from "../books/bookListHelpers/BookFilter";
import BookSort from "../books/bookListHelpers/BookSort";
import BookItem from "../books/bookListHelpers/BookItem";
import { getAuthHeaders } from "../../utils/csrf";


function BooksList() {
  const navigate = useNavigate();
  const location = useLocation();
  const [allBooks, setAllBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);

  useEffect(() => {
    fetch("/books.json")
      .then((res) => res.json())
      .then((data) => {
        setAllBooks(data);
        setFilteredBooks(data);
      })
      .catch((err) => console.error("Error fetching books:", err));
  }, [location.key]);

  const handleSearch = (query) => {
    if (!query || query.length < 2) {
      setFilteredBooks(allBooks);
    } else {
      const lowerQuery = query.toLowerCase();
      const filtered = allBooks.filter(book => 
        book.title?.toLowerCase().includes(lowerQuery) ||
        book.author?.toLowerCase().includes(lowerQuery) ||
        book.genre?.toLowerCase().includes(lowerQuery)
      );
      setFilteredBooks(filtered);
    }
  };

  const handleFilter = (status) => {
    if (status === "all") {
      setFilteredBooks(allBooks);
    } else {
      const filtered = allBooks.filter(book => {
        switch (status) {
          case "available":
            return book.available === true;
          case "unavailable":
            return book.available === false;
          default:
            return true;
        }
      });
      setFilteredBooks(filtered);
    }
  };

  const handleSort = (sortBy) => {
    const sorted = [...filteredBooks].sort((a, b) => {
      if (sortBy === "title") {
        const titleA = a.title || "";
        const titleB = b.title || "";
        return titleA.localeCompare(titleB);
      } else if (sortBy === "author") {
        const authorA = a.author || "";
        const authorB = b.author || "";
        return authorA.localeCompare(authorB);
      } else if (sortBy === "published_year") {
        return (b.published_year || 0) - (a.published_year || 0);
      } else if (sortBy === "rating") {
        return (b.rating || 0) - (a.rating || 0);
      }
      return 0;
    });
    setFilteredBooks(sorted);
  };

  const handleEdit = (attribute, value, book) => {
    const updatedBook = { ...book, [attribute]: value };

    fetch(`/books/${book.id}.json`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ book: updatedBook }),
    })
      .then((res) => res.json())
      .then((data) => {
        // Update both state arrays with the new data from server
        const updatedAll = allBooks.map((b) => (b.id === book.id ? data : b));
        const updatedFiltered = filteredBooks.map((b) => (b.id === book.id ? data : b));
        setAllBooks(updatedAll);
        setFilteredBooks(updatedFiltered);
      })
      .catch((err) => {
        console.error("Error updating book:", err);
        alert("Failed to update book. Please try again.");
      });
  };

  const handleDelete = (book) => {
    if (window.confirm("Are you sure you want to delete this book?")) {
      fetch(`/books/${book.id}.json`, { 
        method: "DELETE",
        headers: getAuthHeaders()
      })
        .then(() => {
          setAllBooks(allBooks.filter((b) => b.id !== book.id));
          setFilteredBooks(filteredBooks.filter((b) => b.id !== book.id));
        })
        .catch((err) => console.error("Error deleting book:", err));
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">My Library</h1>
            <p className="text-gray-600">Manage and explore your book collection</p>
          </div>
          <button
            className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
            onClick={() => navigate("/books/new")}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New Book
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-5 border-l-4 border-blue-500">
            <p className="text-sm text-gray-600 mb-1">Total Books</p>
            <p className="text-3xl font-bold text-gray-900">{allBooks.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-5 border-l-4 border-green-500">
            <p className="text-sm text-gray-600 mb-1">Available</p>
            <p className="text-3xl font-bold text-green-600">
              {allBooks.filter(b => b.available).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-5 border-l-4 border-red-500">
            <p className="text-sm text-gray-600 mb-1">Checked Out</p>
            <p className="text-3xl font-bold text-red-600">
              {allBooks.filter(b => !b.available).length}
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <Search onSearch={handleSearch} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter</label>
              <BookFilter onFilter={handleFilter} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort</label>
              <BookSort onSort={handleSort} />
            </div>
          </div>
        </div>
      </div>

      {/* Books List */}
      {filteredBooks.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <svg className="w-24 h-24 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No books found</h3>
          <p className="text-gray-600 mb-4">
            {allBooks.length === 0 
              ? "Get started by adding your first book to the library"
              : "Try adjusting your search or filter criteria"}
          </p>
          {allBooks.length === 0 && (
            <button
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              onClick={() => navigate("/books/new")}
            >
              Add Your First Book
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBooks.map((book) => (
            <BookItem
              key={book.id}
              book={book}
              handleEdit={handleEdit}
              handleDelete={handleDelete}
              navigate={navigate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default BooksList;