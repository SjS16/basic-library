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
    <div>
      <h2 className="text-2xl font-semibold mb-4">Books in the Library</h2>
      <div className="flex space-between mb-4">
        <div className="w-1/2">
          <button
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            onClick={() => navigate("/books/new")}
          >
            Add New Book
          </button>
        </div>
        <div className="w-1/2 flex flex-col space-y-2">
          <Search onSearch={handleSearch} />
          <BookFilter onFilter={handleFilter} />
          <BookSort onSort={handleSort} />
        </div>
      </div>

      <ul className="space-y-2">
        {filteredBooks.map((book) => (
          <BookItem
            key={book.id}
            book={book}
            handleEdit={handleEdit}
            handleDelete={handleDelete}
            navigate={navigate}
          />
        ))}
      </ul>
    </div>
  );
}

export default BooksList;