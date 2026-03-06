import React, { useState, useEffect } from "react";

function ShowBook() {
  const [book, setBook] = useState({});

  useEffect(() => {
    const bookId = window.location.pathname.split("/").pop();
    fetch(`/books/${bookId}.json`)
      .then((res) => res.json())
      .then((data) => setBook(data))
      .catch((err) => console.error("Error fetching book:", err));
  }, []);

  return (
    <div className="p-6 bg-white rounded shadow">
      <div className="flex justify-between items-center mb-4">
      <h1 className="text-2xl font-bold mb-4">Book Details</h1>
      { book.available ? (
        <p className="text-green-600 font-semibold mb-2">Available</p>
      ) : (
        <p className="text-red-600 font-semibold mb-2">Checked Out</p>
      )}
      </div>
      <p className="text-gray-700">Title: {book.title}</p>
      <p className="text-gray-700">Author: {book.author}</p>
      <p className="text-gray-700">Published Year: {book.published_year}</p>
      <p className="text-gray-700">Description: {book.description}</p>
      <p className="text-gray-700">Genre: {book.genre}</p>
      <p className="text-gray-700">Rating: {book.rating ? `${book.rating}/5` : "No rating"}</p>
      <div className="flex justify-end">
        <button
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={() => window.location.href = `/books/${book.id}/edit`}
        >
          Edit Book
        </button>
      </div>
    </div>
  );
}

export default ShowBook;