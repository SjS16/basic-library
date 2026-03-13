import React, { useState } from "react";
import { getAuthHeaders } from "../../utils/csrf";

function ReadingList({ borrowerId, readingStatuses = [], allBooks = [], onUpdate }) {
  const [selectedBookId, setSelectedBookId] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("want_to_read");

  const statusOptions = [
    { value: "want_to_read", label: "Want to Read", color: "blue" },
    { value: "currently_reading", label: "Currently Reading", color: "yellow" },
    { value: "read", label: "Read", color: "green" },
  ];

  const getStatusBadge = (status) => {
    const config = {
      want_to_read: { bg: "bg-blue-100", text: "text-blue-800", label: "Want to Read" },
      currently_reading: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Reading" },
      read: { bg: "bg-green-100", text: "text-green-800", label: "Read" },
    };
    const c = config[status] || config.want_to_read;
    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold ${c.bg} ${c.text}`}>
        {c.label}
      </span>
    );
  };

  const handleAddBook = () => {
    if (!selectedBookId) return;

    fetch(`/borrowers/${borrowerId}/reading_statuses.json`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        reading_status: {
          book_id: selectedBookId,
          status: selectedStatus,
        },
      }),
    })
      .then((res) => res.json())
      .then(() => {
        onUpdate();
        setSelectedBookId("");
      })
      .catch((err) => console.error("Error adding book:", err));
  };

  const handleUpdateStatus = (readingStatusId, newStatus) => {
    fetch(`/borrowers/${borrowerId}/reading_statuses/${readingStatusId}.json`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        reading_status: { status: newStatus },
      }),
    })
      .then((res) => res.json())
      .then(() => onUpdate())
      .catch((err) => console.error("Error updating status:", err));
  };

  const handleRemove = (readingStatusId) => {
    if (!window.confirm("Remove this book from your reading list?")) return;

    fetch(`/borrowers/${borrowerId}/reading_statuses/${readingStatusId}.json`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    })
      .then(() => onUpdate())
      .catch((err) => console.error("Error removing book:", err));
  };

  const booksInReadingList = readingStatuses.map((rs) => rs.book.id);
  const availableToAdd = allBooks.filter((book) => !booksInReadingList.includes(book.id));

  const groupedReadingStatuses = {
    want_to_read: readingStatuses.filter((rs) => rs.status === "want_to_read"),
    currently_reading: readingStatuses.filter((rs) => rs.status === "currently_reading"),
    read: readingStatuses.filter((rs) => rs.status === "read"),
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">📚 Reading List</h2>

      {/* Add Book Section */}
      <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm sm:text-base font-semibold mb-2 sm:mb-3">Add Book to Reading List</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-2 sm:mb-3">
          <select
            value={selectedBookId}
            onChange={(e) => setSelectedBookId(e.target.value)}
            className="px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a book...</option>
            {availableToAdd.map((book) => (
              <option key={book.id} value={book.id}>
                {book.title} - {book.author}
              </option>
            ))}
          </select>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={handleAddBook}
          disabled={!selectedBookId}
          className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
        >
          Add to Reading List
        </button>
      </div>

      {/* Reading List by Status */}
      <div className="space-y-4">
        {statusOptions.map((statusOpt) => {
          const books = groupedReadingStatuses[statusOpt.value];
          if (books.length === 0) return null;

          return (
            <div key={statusOpt.value}>
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                {statusOpt.label}
                <span className="text-sm text-gray-500">({books.length})</span>
              </h3>
              <div className="space-y-2">
                {books.map((rs) => (
                  <div
                    key={rs.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm sm:text-base font-medium truncate">{rs.book.title}</h4>
                      <p className="text-xs sm:text-sm text-gray-600 truncate">{rs.book.author}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={rs.status}
                        onChange={(e) => handleUpdateStatus(rs.id, e.target.value)}
                        className="text-xs sm:text-sm px-2 py-1 border border-gray-300 rounded flex-1 sm:flex-none"
                      >
                        {statusOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleRemove(rs.id)}
                        className="text-red-600 hover:text-red-800 text-sm sm:text-base flex-shrink-0"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {readingStatuses.length === 0 && (
          <p className="text-sm sm:text-base text-gray-500 text-center py-6 sm:py-8">
            No books in reading list yet. Add your first book above!
          </p>
        )}
      </div>
    </div>
  );
}

export default ReadingList;
