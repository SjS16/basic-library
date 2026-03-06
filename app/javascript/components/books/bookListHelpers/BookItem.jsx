import React from "react";
import { Link } from "react-router-dom";
import StarRating from "./StarRating";
import BookActions from "./BookActions";

function BookItem({ book, handleEdit, handleDelete, navigate }) {
  const handleUpdate = (attr, value) => handleEdit(attr, value, book);
  return (
    <li className="flex justify-between p-3 bg-white rounded shadow hover:bg-gray-50">
      <div>
        <span
          className={`font-semibold mr-2 ${
            book.available ? "text-green-600" : "text-red-600"
          }`}
        >
          {book.available ? "✓" : "✗"}
        </span>
        <Link className="text-blue-600 hover:underline" to={`/books/${book.id}`}>
          {book.title} — {book.author}
        </Link>
        <div className="mt-1">
          <p className="text-gray-700 mb-1">Rating:</p>
          <StarRating
            rating={book.rating || 0}
            setRating={(newRating) => handleUpdate("rating", newRating)}
          />
        </div>
      </div>
      <BookActions
        book={book}
        onUpdate={handleUpdate}
        onDelete={() => handleDelete(book)}
        onNavigate={() => navigate(`/books/${book.id}/edit`)}
      />
    </li>
  );
}

export default BookItem;