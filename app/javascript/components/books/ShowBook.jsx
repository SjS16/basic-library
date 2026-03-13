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
    <div className="p-6 bg-white rounded shadow max-w-6xl mx-auto">
      <div className="flex gap-8">
        {/* Left side - Cover and Edit button */}
        <div className="w-1/2 flex flex-col items-center">
          {book.cover_url ? (
            <img
              src={book.cover_url}
              alt={`${book.title} cover`}
              className="w-full max-w-md rounded shadow-lg mb-6"
            />
          ) : (
            <div className="w-full max-w-md aspect-[2/3] bg-gray-200 rounded shadow-lg mb-6 flex items-center justify-center">
              <div className="text-center text-gray-500 p-8">
                <svg
                  className="w-24 h-24 mx-auto mb-4"
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
                <p className="text-lg">No cover image</p>
              </div>
            </div>
          )}
          <button
            className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 shadow"
            onClick={() => navigate(`/books/${book.id}/edit`)}
          >
            Edit Book
          </button>
        </div>

        {/* Right side - Book info */}
        <div className="w-1/2 flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <h1 className="text-3xl font-bold">{book.title}</h1>
            {book.available ? (
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                Available
              </span>
            ) : (
              <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
                Checked Out
              </span>
            )}
          </div>

          <div className="space-y-4">
            <InfoField label="Author" value={book.author} />
            <InfoField label="Published Year" value={book.published_year} />
            <InfoField label="Genre" value={book.genre} />
            <InfoField
              label="Rating"
              value={book.rating ? `${book.rating}/5 ⭐` : "No rating"}
            />

            {book.description && (
              <div>
                <h2 className="text-sm font-semibold text-gray-600 uppercase mb-2">
                  Description
                </h2>
                <p className="text-gray-700 leading-relaxed">{book.description}</p>
              </div>
            )}
          </div>

          <div className="mt-8 pt-6 border-t">
            <button
              className="px-4 py-2 text-blue-600 hover:text-blue-800 hover:underline"
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
      <h2 className="text-sm font-semibold text-gray-600 uppercase mb-1">
        {label}
      </h2>
      <p className="text-gray-900 text-lg">{value}</p>
    </div>
  );
}

export default ShowBook;