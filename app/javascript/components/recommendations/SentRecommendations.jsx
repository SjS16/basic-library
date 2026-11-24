import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

// Everything this member has recommended to other people, and
// what came of it: still waiting, accepted onto their list, or
// passed. Passes live here and only here; nobody is pinged
// about them.
function SentRecommendations() {
  const [sent, setSent] = useState([]);

  useEffect(() => {
    fetch("/recommendations.json")
      .then((res) => (res.ok ? res.json() : { sent: [] }))
      .then((data) => setSent(data.sent || []))
      .catch(() => {});
  }, []);

  if (sent.length === 0) return null;

  const statusChip = (status) => {
    if (status === "accepted") {
      return (
        <span className="px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-800 flex-shrink-0">
          Accepted
        </span>
      );
    }
    if (status === "declined") {
      return (
        <span className="px-2 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-600 flex-shrink-0">
          Passed
        </span>
      );
    }
    return (
      <span className="px-2 py-1 rounded text-xs font-semibold bg-amber-100 text-amber-800 flex-shrink-0">
        Waiting
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mt-4 sm:mt-6">
      <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
        Recommendations You've Sent ({sent.length})
      </h2>
      <div className="space-y-2">
        {sent.map((r) => (
          <div key={r.id} className="flex items-start justify-between gap-2 sm:gap-3 p-3 border border-gray-200 rounded-lg">
            <div className="min-w-0 flex-1">
              <h3 className="text-sm sm:text-base font-medium truncate">
                {r.book.in_library ? (
                  <Link to={`/books/${r.book.id}`} className="hover:text-amber-800 hover:underline">
                    {r.book.title}
                  </Link>
                ) : (
                  r.book.title
                )}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 truncate">{r.book.author}</p>
              <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                To {r.recipient.name} · {new Date(r.created_at).toLocaleDateString()}
              </p>
              {r.note && <p className="text-sm text-gray-700 italic mt-1">“{r.note}”</p>}
            </div>
            {statusChip(r.status)}
          </div>
        ))}
      </div>
    </div>
  );
}

export default SentRecommendations;
