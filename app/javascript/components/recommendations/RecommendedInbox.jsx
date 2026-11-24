import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAuthHeaders } from "../../utils/csrf";

// Recommendations other members have sent this member, waiting
// for a decision. Accepting puts the book on their to-be-read
// list, where it resolves against the shelves like any other
// wish; the list cap applies, and a full list answers with the
// reason instead of failing quietly.
function RecommendedInbox({ onAccepted }) {
  const [recommendations, setRecommendations] = useState([]);
  const [errors, setErrors] = useState({});
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    fetch("/recommendations.json")
      .then((res) => (res.ok ? res.json() : { recommendations: [] }))
      .then((data) => setRecommendations(data.recommendations || []))
      .catch(() => {});
  }, []);

  const act = async (id, action) => {
    setBusyId(id);
    setErrors((prev) => ({ ...prev, [id]: "" }));
    try {
      const res = await fetch(`/recommendations/${id}/${action}.json`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setRecommendations((prev) => prev.filter((r) => r.id !== id));
        if (action === "accept" && onAccepted) onAccepted();
      } else {
        setErrors((prev) => ({ ...prev, [id]: data.error || "Something went wrong. Please try again." }));
      }
    } catch (err) {
      setErrors((prev) => ({ ...prev, [id]: "Something went wrong. Please try again." }));
    }
    setBusyId(null);
  };

  if (recommendations.length === 0) return null;

  const libraryChip = (book) => {
    if (!book.in_library) {
      return (
        <span className="px-2 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-600 flex-shrink-0">
          Not in the library
        </span>
      );
    }
    if (book.available) {
      return (
        <span className="px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-800 flex-shrink-0">
          In the library · Available
        </span>
      );
    }
    return (
      <span className="px-2 py-1 rounded text-xs font-semibold bg-amber-100 text-amber-800 flex-shrink-0">
        In the library · Checked out
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
      <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
        💌 Recommended for You ({recommendations.length})
      </h2>
      <div className="space-y-2 sm:space-y-3">
        {recommendations.map((r) => (
          <div key={r.id} className="p-3 sm:p-4 border border-gray-200 rounded-lg">
            <div className="flex items-start justify-between gap-2 sm:gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="text-sm sm:text-base font-bold text-gray-900 truncate">
                  {r.book.in_library ? (
                    <Link to={`/books/${r.book.id}`} className="hover:text-amber-800 hover:underline">
                      {r.book.title}
                    </Link>
                  ) : (
                    r.book.title
                  )}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 truncate">{r.book.author}</p>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  Recommended by <span className="font-medium text-gray-800">{r.recommender.name}</span>
                </p>
                {r.note && (
                  <p className="text-sm text-gray-700 italic mt-1">“{r.note}”</p>
                )}
              </div>
              {libraryChip(r.book)}
            </div>
            <div className="flex gap-2 mt-3 flex-wrap">
              <button
                onClick={() => act(r.id, "accept")}
                disabled={busyId === r.id}
                className="px-3 py-1.5 text-xs sm:text-sm bg-amber-800 text-amber-50 rounded hover:bg-amber-900 disabled:opacity-50 transition-colors"
              >
                Add to my to-be-read list
              </button>
              <button
                onClick={() => act(r.id, "decline")}
                disabled={busyId === r.id}
                className="px-3 py-1.5 text-xs sm:text-sm bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                No thanks
              </button>
            </div>
            {errors[r.id] && <p className="text-xs sm:text-sm text-red-700 mt-2">{errors[r.id]}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default RecommendedInbox;
