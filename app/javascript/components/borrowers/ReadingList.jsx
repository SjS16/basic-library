import React, { useState } from "react";
import { getAuthHeaders } from "../../utils/csrf";

const TBR_LIMIT = 20;

function ReadingList({ borrowerId, borrowerName, readingStatuses = [], allBooks = [], onUpdate, isOwner = false, onLend, viewerIsSelf = false }) {
  const [selectedBookId, setSelectedBookId] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("want_to_read");
  const [addError, setAddError] = useState("");
  const [listError, setListError] = useState("");
  const [customBook, setCustomBook] = useState({ title: "", author: "", genre: "", published_year: "" });
  const [customError, setCustomError] = useState("");
  const [customSaving, setCustomSaving] = useState(false);

  const statusOptions = [
    { value: "want_to_read", label: "Want to Read", color: "blue" },
    { value: "currently_reading", label: "Currently Reading", color: "yellow" },
    { value: "read", label: "Read", color: "green" },
  ];

  const errorText = (data) => {
    if (!data) return "Something went wrong. Please try again.";
    if (data.error) return data.error;
    return Object.values(data).flat().join(", ");
  };

  const handleAddBook = async () => {
    if (!selectedBookId) return;
    setAddError("");

    try {
      const res = await fetch(`/borrowers/${borrowerId}/reading_statuses.json`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          reading_status: {
            book_id: selectedBookId,
            status: selectedStatus,
          },
        }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        setSelectedBookId("");
        onUpdate();
      } else {
        setAddError(errorText(data));
      }
    } catch (err) {
      setAddError("Something went wrong. Please try again.");
    }
  };

  const handleUpdateStatus = async (readingStatusId, newStatus) => {
    setListError("");
    try {
      const res = await fetch(`/borrowers/${borrowerId}/reading_statuses/${readingStatusId}.json`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          reading_status: { status: newStatus },
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setListError(errorText(data));
      }
    } catch (err) {
      setListError("Something went wrong. Please try again.");
    }
    onUpdate();
  };

  const handleUpdateRating = async (readingStatusId, rating) => {
    setListError("");
    try {
      const res = await fetch(`/borrowers/${borrowerId}/reading_statuses/${readingStatusId}.json`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          reading_status: { rating },
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setListError(errorText(data));
      }
    } catch (err) {
      setListError("Something went wrong. Please try again.");
    }
    onUpdate();
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

  const handleCustomSubmit = async (e) => {
    e.preventDefault();
    setCustomError("");
    setCustomSaving(true);
    try {
      const res = await fetch(`/borrowers/${borrowerId}/wishlist_books.json`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ book: customBook }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        setCustomBook({ title: "", author: "", genre: "", published_year: "" });
        onUpdate();
      } else {
        setCustomError(errorText(data));
      }
    } catch (err) {
      setCustomError("Something went wrong. Please try again.");
    }
    setCustomSaving(false);
  };

  const booksInReadingList = readingStatuses.map((rs) => rs.book.id);
  const availableToAdd = allBooks.filter((book) => !booksInReadingList.includes(book.id));

  const groupedReadingStatuses = {
    want_to_read: readingStatuses.filter((rs) => rs.status === "want_to_read"),
    currently_reading: readingStatuses.filter((rs) => rs.status === "currently_reading"),
    read: readingStatuses.filter((rs) => rs.status === "read"),
  };

  const tbrCount = groupedReadingStatuses.want_to_read.length;
  const tbrFull = tbrCount >= TBR_LIMIT;

  // Whether the library owns a book on the want-to-read list, and
  // whether it can go out the door right now.
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

  const renderStars = (rs) => (
    <div className="flex items-center gap-0.5" title="Rate this book">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onClick={() => handleUpdateRating(rs.id, n)}
          className="text-lg leading-none text-amber-500 hover:scale-125 transition-transform"
          aria-label={`Rate ${n} of 5`}
        >
          {rs.rating && n <= rs.rating ? "★" : "☆"}
        </button>
      ))}
    </div>
  );

  const customInputClasses =
    "w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-transparent bg-white";

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">📚 Reading List</h2>

      {viewerIsSelf && (
      <>
      {/* Add a book the library owns */}
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
          disabled={!selectedBookId || (selectedStatus === "want_to_read" && tbrFull)}
          className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base bg-amber-800 text-amber-50 rounded-lg hover:bg-amber-900 disabled:bg-gray-300 transition-colors"
        >
          Add to Reading List
        </button>
        {selectedStatus === "want_to_read" && tbrFull && (
          <p className="text-xs sm:text-sm text-amber-700 mt-2">
            The to-be-read list is full ({TBR_LIMIT} books). Move one to Read or remove it to add another.
          </p>
        )}
        {addError && <p className="text-xs sm:text-sm text-red-700 mt-2">{addError}</p>}
      </div>

      {/* Add a book the library does not own yet */}
      <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-amber-50 rounded-lg border border-amber-200">
        <h3 className="text-sm sm:text-base font-semibold mb-1 sm:mb-2">Add a Book the Library Doesn't Have</h3>
        <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
          It goes on the to-be-read list marked "Not in the library". If the owner ever adds a copy,
          your entry points at the real book automatically.
        </p>
        <form onSubmit={handleCustomSubmit} className="space-y-2 sm:space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            <input
              type="text"
              required
              placeholder="Title *"
              value={customBook.title}
              onChange={(e) => setCustomBook({ ...customBook, title: e.target.value })}
              className={customInputClasses}
            />
            <input
              type="text"
              required
              placeholder="Author *"
              value={customBook.author}
              onChange={(e) => setCustomBook({ ...customBook, author: e.target.value })}
              className={customInputClasses}
            />
            <input
              type="text"
              placeholder="Genre (optional)"
              value={customBook.genre}
              onChange={(e) => setCustomBook({ ...customBook, genre: e.target.value })}
              className={customInputClasses}
            />
            <input
              type="number"
              placeholder="Published year (optional)"
              value={customBook.published_year}
              onChange={(e) => setCustomBook({ ...customBook, published_year: e.target.value })}
              className={customInputClasses}
            />
          </div>
          <button
            type="submit"
            disabled={!customBook.title.trim() || !customBook.author.trim() || customSaving || tbrFull}
            className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base bg-amber-800 text-amber-50 rounded-lg hover:bg-amber-900 disabled:bg-gray-300 transition-colors"
          >
            {customSaving ? "Adding…" : "Add to To-Be-Read List"}
          </button>
          {tbrFull && (
            <p className="text-xs sm:text-sm text-amber-700">
              The to-be-read list is full ({TBR_LIMIT} books). Move one to Read or remove it to add another.
            </p>
          )}
          {customError && <p className="text-xs sm:text-sm text-red-700">{customError}</p>}
        </form>
      </div>
      </>
      )}

      {listError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs sm:text-sm text-red-700">{listError}</p>
        </div>
      )}

      {/* Reading List by Status */}
      <div className="space-y-4">
        {statusOptions.map((statusOpt) => {
          const books = groupedReadingStatuses[statusOpt.value];
          if (books.length === 0) return null;

          return (
            <div key={statusOpt.value}>
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                {statusOpt.label}
                <span className="text-sm text-gray-500">
                  ({books.length}{statusOpt.value === "want_to_read" ? `/${TBR_LIMIT}` : ""})
                </span>
              </h3>
              <div className="space-y-2">
                {books.map((rs) => (
                  <div
                    key={rs.id}
                    className="flex flex-col gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-start justify-between gap-2 sm:gap-3">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm sm:text-base font-medium truncate">{rs.book.title}</h4>
                        <p className="text-xs sm:text-sm text-gray-600 truncate">{rs.book.author}</p>
                      </div>
                      {statusOpt.value === "want_to_read" && libraryChip(rs.book)}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {statusOpt.value === "read" && renderStars(rs)}
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
                      {statusOpt.value === "want_to_read" && isOwner && onLend && rs.book.in_library && rs.book.available && (
                        <button
                          onClick={() => onLend(rs.book.id)}
                          className="px-3 py-1 text-xs sm:text-sm bg-amber-800 text-amber-50 rounded hover:bg-amber-900 transition-colors"
                        >
                          Lend to {borrowerName}
                        </button>
                      )}
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
            {viewerIsSelf
              ? "No books in reading list yet. Add your first book above!"
              : "No books in this member's reading list yet."}
          </p>
        )}
      </div>
    </div>
  );
}

export default ReadingList;
