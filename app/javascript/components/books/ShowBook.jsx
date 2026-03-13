import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

function ShowBook() {
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

  return (
    <div className="p-4 sm:p-6 bg-white rounded shadow max-w-6xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* Left side - Cover and Edit button */}
        <div className="w-full lg:w-1/2 flex flex-col items-center">
          {book.cover_url ? (
            <img
              src={book.cover_url}
              alt={`${book.title} cover`}
              className="w-full max-w-sm lg:max-w-md rounded shadow-lg mb-4 sm:mb-6"
            />
          ) : (
            <div className="w-full max-w-sm lg:max-w-md aspect-[2/3] bg-gray-200 rounded shadow-lg mb-4 sm:mb-6 flex items-center justify-center">
              <div className="text-center text-gray-500 p-6 sm:p-8">
                <svg
                  className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
                <p className="text-base sm:text-lg">No cover image</p>
              </div>
            </div>
          )}
          <button
            className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-amber-800 text-amber-50 rounded hover:bg-amber-900 shadow text-sm sm:text-base"
            onClick={() => navigate(`/books/${book.id}/edit`)}
          >
            Edit Book
          </button>
        </div>

        {/* Right side - Book info */}
        <div className="w-full lg:w-1/2 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-4 mb-4 sm:mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold">{book.title}</h1>
            {book.available ? (
              <span className="px-2 sm:px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-xs sm:text-sm font-semibold self-start border border-amber-900">
                Available
              </span>
            ) : (
              <span className="px-2 sm:px-3 py-1 bg-red-100 text-red-900 rounded-full text-xs sm:text-sm font-semibold self-start border border-red-900">
                Checked Out
              </span>
            )}
          </div>

          <div className="space-y-3 sm:space-y-4">
            <InfoField label="Author" value={book.author} />
            <InfoField label="Published Year" value={book.published_year} />
            <InfoField label="Genre" value={book.genre} />
            <InfoField
              label="Rating"
              value={book.rating ? `${book.rating}/5 ⭐` : "No rating"}
            />

            {book.description && (
              <div>
                <h2 className="text-xs sm:text-sm font-semibold text-gray-600 uppercase mb-2">
                  Description
                </h2>
                <p className="text-gray-700 leading-relaxed text-sm sm:text-base">{book.description}</p>
              </div>
            )}
          </div>

          <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t">
            <button
              className="px-3 sm:px-4 py-2 text-sm sm:text-base text-blue-600 hover:text-blue-800 hover:underline"
              onClick={() => navigate("/books")}
            >
              ← Back to Library
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoField({ label, value }) {
  if (!value) return null;
  
  return (
    <div>
      <h2 className="text-xs sm:text-sm font-semibold text-gray-600 uppercase mb-1">
        {label}
      </h2>
      <p className="text-gray-900 text-base sm:text-lg">{value}</p>
    </div>
  );
}

export default ShowBook;