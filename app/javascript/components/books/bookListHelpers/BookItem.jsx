import React from "react";
import { Link } from "react-router-dom";
import StarRating from "./StarRating";
import BookActions from "./BookActions";

function BookItem({ book, handleEdit, handleDelete, navigate }) {
  const handleUpdate = (attr, value) => handleEdit(attr, value, book);
  
  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-200 overflow-hidden border border-gray-100">
      <div className="flex gap-4 p-5">
        {/* Book Cover Thumbnail */}
        <div className="flex-shrink-0">
          {book.cover_url ? (
            <img
              src={book.cover_url}
              alt={book.title}
              className="w-24 h-32 object-cover rounded shadow-sm"
            />
          ) : (
            <div className="w-24 h-32 bg-gradient-to-br from-gray-200 to-gray-300 rounded shadow-sm flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          )}
        </div>

        {/* Book Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <Link 
                to={`/books/${book.id}`}
                className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors block mb-1"
              >
                {book.title}
              </Link>
              <p className="text-gray-600 text-sm mb-2">by {book.author}</p>
              
              <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
                {book.published_year && (
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {book.published_year}
                  </span>
                )}
                {book.genre && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                    {book.genre}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <StarRating
                  rating={book.rating || 0}
                  setRating={(newRating) => handleUpdate("rating", newRating)}
                />
                {book.rating > 0 && (
                  <span className="text-sm text-gray-600">({book.rating}/5)</span>
                )}
              </div>
            </div>

            {/* Availability Badge */}
            <div className="ml-4">
              {book.available ? (
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Available
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-red-100 text-red-800">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                  Checked Out
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons Footer */}
      <div className="bg-gray-50 px-5 py-3 border-t border-gray-100">
        <BookActions
          book={book}
          onUpdate={handleUpdate}
          onDelete={() => handleDelete(book)}
          onNavigate={() => navigate(`/books/${book.id}/edit`)}
        />
      </div>
    </div>
  );
}

export default BookItem;