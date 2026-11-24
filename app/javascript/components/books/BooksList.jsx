import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Search from "../books/bookListHelpers/Search";
import BookFilter from "../books/bookListHelpers/BookFilter";
import BookSort from "../books/bookListHelpers/BookSort";
import BookItem from "../books/bookListHelpers/BookItem";
import { getAuthHeaders } from "../../utils/csrf";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import Pagination from "../Pagination";

const BOOKS_PER_PAGE = 20;

function BooksList() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = useCurrentUser();
  const isOwner = !!currentUser?.owner;
  const [allBooks, setAllBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [page, setPage] = useState(1);
  const [manageOpen, setManageOpen] = useState(false);

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
    setPage(1);
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
    setPage(1);
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
    setPage(1);
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
      } else if (sortBy === "recently_added") {
        const dateA = new Date(a.created_at || 0);
        const dateB = new Date(b.created_at || 0);
        return dateB - dateA; // Newest first
      }
      return 0;
    });
    setFilteredBooks(sorted);
  };

  const handleSurprise = () => {
    const pool = allBooks.filter((b) => b.available);
    if (pool.length === 0) return;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    navigate(`/books/${pick.id}`);
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

  const totalPages = Math.ceil(filteredBooks.length / BOOKS_PER_PAGE);
  const currentPage = Math.min(page, Math.max(totalPages, 1));
  const pageBooks = filteredBooks.slice((currentPage - 1) * BOOKS_PER_PAGE, currentPage * BOOKS_PER_PAGE);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6">
      {/* Header Section */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">{isOwner ? "My Library" : "Available Books"}</h1>
            <p className="text-sm sm:text-base text-gray-600">{isOwner ? "Manage and explore your book collection" : "Every book on the shelves, out or in. Request anything you'd like to borrow."}</p>
          </div>
          {isOwner && (
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <button
                  className="w-full px-4 sm:px-6 py-2 sm:py-3 bg-white border-2 border-amber-900 text-amber-900 rounded-lg hover:bg-amber-100 shadow transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base whitespace-nowrap font-medium"
                  onClick={() => setManageOpen((open) => !open)}
                >
                  Manage Library
                  <svg className={`w-4 h-4 transition-transform ${manageOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {manageOpen && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setManageOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-30 py-1">
                      <button
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-amber-50"
                        onClick={() => { setManageOpen(false); navigate("/books/enrich"); }}
                      >
                        Fill Missing Details
                      </button>
                      <button
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-amber-50"
                        onClick={() => { setManageOpen(false); navigate("/books/import"); }}
                      >
                        Import CSV
                      </button>
                      <a
                        href="/books/export.csv"
                        className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-amber-50"
                        onClick={() => setManageOpen(false)}
                      >
                        Export Catalogue (CSV)
                      </a>
                    </div>
                  </>
                )}
              </div>
              <button
              className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-amber-800 to-amber-900 text-amber-50 rounded-lg hover:from-amber-900 hover:to-amber-950 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base whitespace-nowrap"
              onClick={() => navigate("/books/new")}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Add New Book</span>
              <span className="sm:hidden">Add Book</span>
              </button>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4 sm:p-5 border-l-4 border-blue-500">
            <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Books</p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">{allBooks.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 sm:p-5 border-l-4 border-green-500">
            <p className="text-xs sm:text-sm text-gray-600 mb-1">Available</p>
            <p className="text-2xl sm:text-3xl font-bold text-green-600">
              {allBooks.filter(b => b.available).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 sm:p-5 border-l-4 border-red-500">
            <p className="text-xs sm:text-sm text-gray-600 mb-1">Checked Out</p>
            <p className="text-2xl sm:text-3xl font-bold text-red-600">
              {allBooks.filter(b => !b.available).length}
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Search</label>
              <Search onSearch={handleSearch} />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Filter</label>
              <BookFilter onFilter={handleFilter} />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Sort</label>
              <BookSort onSort={handleSort} />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleSurprise}
              disabled={!allBooks.some((b) => b.available)}
              className="px-4 py-2 bg-white border-2 border-amber-900 text-amber-900 rounded-lg hover:bg-amber-100 shadow transition-all duration-200 text-sm font-medium disabled:opacity-50"
            >
              🎲 Surprise me — a random available book
            </button>
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
              ? (isOwner ? "Get started by adding your first book to the library" : "No books on the shelves yet")
              : "Try adjusting your search or filter criteria"}
          </p>
          {allBooks.length === 0 && isOwner && (
            <button
              className="px-6 py-2 bg-amber-800 text-amber-50 rounded-lg hover:bg-amber-900 transition-colors"
              onClick={() => navigate("/books/new")}
            >
              Add Your First Book
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {pageBooks.map((book) => (
              <BookItem
                key={book.id}
                book={book}
                isOwner={isOwner}
                handleEdit={handleEdit}
                handleDelete={handleDelete}
                navigate={navigate}
              />
            ))}
          </div>
          {totalPages > 1 && (
            <p className="text-center text-sm text-gray-500 mt-6">
              Showing {(currentPage - 1) * BOOKS_PER_PAGE + 1}–{Math.min(currentPage * BOOKS_PER_PAGE, filteredBooks.length)} of {filteredBooks.length} books
            </p>
          )}
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}

export default BooksList;