import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getAuthHeaders } from "../../utils/csrf";

function EditBook() {
  const [book, setBook] = useState({});
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    if (id) {
      fetch(`/books/${id}.json`)
        .then((res) => res.json())
        .then((data) => setBook(data))
        .catch((err) => console.error("Error fetching book:", err));
    }
  }, [id]);

  const saveChanges = () => {
    if (!book.id) {
      // Create new book
      fetch("/books.json", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ book: book }),
      })
        .then((res) => res.json())
        .then((data) => {
          alert("Book created successfully!");
          navigate("/books");
        })
        .catch((err) => console.error("Error creating book:", err));
      return;
    }

    // Update existing book
    fetch(`/books/${book.id}.json`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ book: book }),
    })
      .then((res) => res.json())
      .then((data) => {
        alert("Book updated successfully!");
        navigate("/books");
      })
      .catch((err) => console.error("Error updating book:", err));
  }

  return (
    <div className="p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Edit Book</h1>
      <p className="text-gray-700">Title: </p>
      <input
        type="text"
        value={book.title || ""}
        onChange={(e) => setBook({ ...book, title: e.target.value })}
        className="w-full p-2 border rounded mb-4"
      />
      <p className="text-gray-700">Author:</p>
      <input
        type="text"
        value={book.author || ""}
        onChange={(e) => setBook({ ...book, author: e.target.value })}
        className="w-full p-2 border rounded mb-4"
      />
      <p className="text-gray-700">Published Year:</p>
      <input
        type="text"
        value={book.published_year || ""}
        onChange={(e) => setBook({ ...book, published_year: e.target.value })}
        className="w-full p-2 border rounded mb-4"
      />
      <p className="text-gray-700">Description:</p>
      <textarea
        value={book.description || ""}
        onChange={(e) => setBook({ ...book, description: e.target.value })}
        className="w-full p-2 border rounded mb-4"
      />
      <p className="text-gray-700">Genre:</p>
      <input
        type="text"
        value={book.genre || ""}
        onChange={(e) => setBook({ ...book, genre: e.target.value })}
        className="w-full p-2 border rounded mb-4"
      />
      <p className="text-gray-700">Rating (1-5):</p>
      <input
        type="number"
        min="1"
        max="5"
        value={book.rating || ""}
        onChange={(e) => setBook({ ...book, rating: e.target.value })}
        className="w-full p-2 border rounded mb-4"
      />
      <div className="flex items-center mb-4">
        <p className="text-gray-700 mr-2">Available:</p>
        <input
          type="checkbox"
          checked={book.available || false}
          onChange={(e) => setBook({ ...book, available: e.target.checked })}
          className="h-4 w-4"
        />
      </div>
      <div className="flex justify-end">
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={saveChanges}
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}

export default EditBook;