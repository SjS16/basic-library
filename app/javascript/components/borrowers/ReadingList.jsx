import React, { useState } from "react";
import { getAuthHeaders } from "../../utils/csrf";
import { Link } from "react-router-dom";
import { useOpenLibrarySearch } from "../../hooks/useOpenLibrarySearch";
import { fetchBookDetails } from "../../utils/openLibraryApi";
import SearchResults from "../books/SearchResults";

const TBR_LIMIT = 20;

function ReadingList({ borrowerId, borrowerName, readingStatuses = [], allBooks = [], onUpdate, isOwner = false, onLend, viewerIsSelf = false }) {
  const [listError, setListError] = useState("");
  const [newBook, setNewBook] = useState({ title: "", author: "", genre: "", published_year: "" });
  const [newStatus, setNewStatus] = useState("want_to_read");
  const [addError, setAddError] = useState("");
  const [addNotice, setAddNotice] = useState(null);
  const [addSaving, setAddSaving] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [justFinishedId, setJustFinishedId] = useState(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const { searchResults, clearResults } = useOpenLibrarySearch(searchTerm);
  const [picked, setPicked] = useState(null);

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

  // The one add path for everything: the title + author are looked
  // up against the whole collection first (the same lookup the
  // owner's add uses). A match joins the list as the real book; no
  // match creates a wishlist record flagged not in the library.
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setAddError("");
    setAddNotice(null);
    setAddSaving(true);
    try {
      // If the book was picked from the Open Library suggestions
      // and the fields still match the pick, its ISBN and cover
      // ride along so the library match can use the ISBN.
      const stillPicked = picked && picked.title === newBook.title && picked.author === newBook.author;
      const payload = stillPicked ? { ...newBook, isbn: picked.isbn, cover_url: picked.cover_url } : newBook;
      const res = await fetch(`/borrowers/${borrowerId}/wishlist_books.json`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ book: payload, status: newStatus }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        const book = data.book || {};
        setAddNotice(
          book.in_library
            ? {
                kind: "found",
                text: `Good news: the library has “${book.title}”. It's on your list now${book.available ? ", and it's available to request" : ", though it's currently checked out"}.`,
              }
            : {
                kind: "missing",
                text: `“${book.title}” isn't in the library yet, so it's on your list as a wish. If the owner adds a copy, your entry will point at it automatically.`,
              }
        );
        setNewBook({ title: "", author: "", genre: "", published_year: "" });
        setPicked(null);
        onUpdate();
      } else {
        setAddError(errorText(data));
      }
    } catch (err) {
      setAddError("Something went wrong. Please try again.");
    }
    setAddSaving(false);
  };

  // The same Open Library search the owner's add-book page uses:
  // typing a title suggests real books, and picking one fills the
  // author, year, and genre from Open Library's data. The server
  // then matches the pick against the library (by ISBN first).
  const handleTitleChange = (title) => {
    setNewBook((prev) => ({ ...prev, title }));
    setSearchTerm(title);
  };

  const handleLookupSelect = async (result) => {
    const details = await fetchBookDetails(result);
    setNewBook({
      title: details.title || "",
      author: details.author || "",
      genre: details.genre || "",
      published_year: details.published_year || "",
    });
    setPicked({
      title: details.title || "",
      author: details.author || "",
      isbn: details.isbn || "",
      cover_url: details.cover_url || "",
    });
    clearResults();
    setSearchTerm("");
  };

  const handleDismissSearch = () => {
    clearResults();
    setSearchTerm("");
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

  // The finish line: one tap moves a book to Read, and its row
  // then asks for a star rating while the finish is fresh.
  const handleFinish = async (rs) => {
    await handleUpdateStatus(rs.id, "read");
    setJustFinishedId(rs.id);
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

  const handleSaveNote = async (rs) => {
    setListError("");
    try {
      const res = await fetch(`/borrowers/${borrowerId}/reading_statuses/${rs.id}.json`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          reading_status: { notes: noteDraft },
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setListError(errorText(data));
      } else {
        setEditingNoteId(null);
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

  // Alphabetical within each group: by author, then by title.
  const byAuthorThenTitle = (a, b) => {
    const authorOrder = (a.book.author || "").localeCompare(b.book.author || "", undefined, { sensitivity: "base" });
    if (authorOrder !== 0) return authorOrder;
    return (a.book.title || "").localeCompare(b.book.title || "", undefined, { sensitivity: "base" });
  };

  const groupedReadingStatuses = {
    want_to_read: readingStatuses.filter((rs) => rs.status === "want_to_read").sort(byAuthorThenTitle),
    currently_reading: readingStatuses.filter((rs) => rs.status === "currently_reading").sort(byAuthorThenTitle),
    read: readingStatuses.filter((rs) => rs.status === "read").sort(byAuthorThenTitle),
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

  const renderStars = (rs) => {
    // Only the list's owner can rate. Anyone else just sees the stars.
    if (!viewerIsSelf) {
      if (!rs.rating) return null;
      return (
        <div className="flex items-center gap-0.5" title={`Rated ${rs.rating} of 5`}>
          {[1, 2, 3, 4, 5].map((n) => (
            <span key={n} className="text-lg leading-none text-amber-500">
              {n <= rs.rating ? "★" : "☆"}
            </span>
          ))}
        </div>
      );
    }
    return (
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
  };

  const customInputClasses =
    "w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-transparent bg-white";

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
      <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
        <h2 className="text-xl sm:text-2xl font-bold">📚 Reading List</h2>
        {viewerIsSelf && (
          <a
            href={`/borrowers/${borrowerId}/reading_list_export.csv`}
            className="text-xs sm:text-sm px-3 py-1.5 bg-white border border-amber-900 text-amber-900 rounded hover:bg-amber-100 font-medium whitespace-nowrap"
          >
            Export my list (CSV)
          </a>
        )}
      </div>

      {viewerIsSelf && (
      <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm sm:text-base font-semibold mb-1 sm:mb-2">Add a Book to Your List</h3>
        <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
          Start typing a title and pick from the Open Library suggestions, or just type any
          book. If it is on the shelves, the real book joins your list; if not, it goes on as
          a wish, marked "Not in the library".
        </p>
        <form onSubmit={handleAddSubmit} className="space-y-2 sm:space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            <div className="relative">
              <input
                type="text"
                required
                placeholder="Title *"
                value={newBook.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className={customInputClasses}
              />
              <div className="absolute left-0 right-0 top-full z-30 mt-1">
                <SearchResults results={searchResults} onSelect={handleLookupSelect} onDismiss={handleDismissSearch} />
              </div>
            </div>
            <input
              type="text"
              required
              placeholder="Author *"
              value={newBook.author}
              onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
              className={customInputClasses}
            />
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className={customInputClasses}
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Genre (optional, for wishes)"
              value={newBook.genre}
              onChange={(e) => setNewBook({ ...newBook, genre: e.target.value })}
              className={customInputClasses}
            />
            <input
              type="number"
              placeholder="Published year (optional)"
              value={newBook.published_year}
              onChange={(e) => setNewBook({ ...newBook, published_year: e.target.value })}
              className={customInputClasses}
            />
          </div>
          <button
            type="submit"
            disabled={!newBook.title.trim() || !newBook.author.trim() || addSaving || (newStatus === "want_to_read" && tbrFull)}
            className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base bg-amber-800 text-amber-50 rounded-lg hover:bg-amber-900 disabled:bg-gray-300 transition-colors"
          >
            {addSaving ? "Adding…" : "Add to My List"}
          </button>
          {newStatus === "want_to_read" && tbrFull && (
            <p className="text-xs sm:text-sm text-amber-700">
              The to-be-read list is full ({TBR_LIMIT} books). Move one to Read or remove it to add another.
            </p>
          )}
          {addError && <p className="text-xs sm:text-sm text-red-700">{addError}</p>}
          {addNotice && (
            <div className={`p-3 rounded-lg border ${addNotice.kind === "found" ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}`}>
              <p className={`text-xs sm:text-sm ${addNotice.kind === "found" ? "text-green-800" : "text-amber-900"}`}>
                {addNotice.text}
              </p>
            </div>
          )}
        </form>
      </div>
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
                        <h4 className="text-sm sm:text-base font-medium truncate">
                          {rs.book.in_library ? (
                            <Link to={`/books/${rs.book.id}`} className="hover:text-amber-800 hover:underline">
                              {rs.book.title}
                            </Link>
                          ) : (
                            rs.book.title
                          )}
                        </h4>
                        <p className="text-xs sm:text-sm text-gray-600 truncate">{rs.book.author}</p>
                      </div>
                      {statusOpt.value === "want_to_read" && libraryChip(rs.book)}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {statusOpt.value === "read" && renderStars(rs)}
                      {statusOpt.value === "currently_reading" && viewerIsSelf && (
                        <button
                          onClick={() => handleFinish(rs)}
                          className="px-3 py-1 text-xs sm:text-sm bg-green-700 text-white rounded hover:bg-green-800 transition-colors"
                        >
                          Finished it ✓
                        </button>
                      )}
                      {viewerIsSelf && (
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
                      )}
                      {statusOpt.value === "want_to_read" && isOwner && onLend && rs.book.in_library && rs.book.available && (
                        <button
                          onClick={() => onLend(rs.book.id)}
                          className="px-3 py-1 text-xs sm:text-sm bg-amber-800 text-amber-50 rounded hover:bg-amber-900 transition-colors"
                        >
                          Lend to {borrowerName}
                        </button>
                      )}
                      {viewerIsSelf && (
                        <button
                          onClick={() => handleRemove(rs.id)}
                          className="text-red-600 hover:text-red-800 text-sm sm:text-base flex-shrink-0"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    {justFinishedId === rs.id && rs.status === "read" && viewerIsSelf && (
                      <div className="flex items-center gap-2 flex-wrap p-2 bg-green-50 border border-green-200 rounded">
                        <span className="text-xs sm:text-sm text-green-800 font-medium">Finished! How was it?</span>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <button
                              key={n}
                              onClick={() => { handleUpdateRating(rs.id, n); setJustFinishedId(null); }}
                              className="text-lg leading-none text-amber-500 hover:scale-125 transition-transform"
                              aria-label={`Rate ${n} of 5`}
                            >
                              ☆
                            </button>
                          ))}
                        </div>
                        <button onClick={() => setJustFinishedId(null)} className="text-xs text-gray-500 hover:underline">
                          Skip
                        </button>
                      </div>
                    )}
                    {(viewerIsSelf || rs.notes) && rs.status !== "want_to_read" && (
                      <div className="border-t border-gray-100 pt-2">
                        {editingNoteId === rs.id ? (
                          <div className="space-y-2">
                            <textarea
                              value={noteDraft}
                              onChange={(e) => setNoteDraft(e.target.value)}
                              rows={3}
                              placeholder="Your notes on this book…"
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-transparent"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSaveNote(rs)}
                                className="px-3 py-1.5 text-xs sm:text-sm bg-amber-800 text-amber-50 rounded hover:bg-amber-900"
                              >
                                Save note
                              </button>
                              <button
                                onClick={() => setEditingNoteId(null)}
                                className="px-3 py-1.5 text-xs sm:text-sm text-gray-600 hover:underline"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : rs.notes ? (
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm text-gray-700 italic whitespace-pre-wrap">{rs.notes}</p>
                            {viewerIsSelf && (
                              <button
                                onClick={() => { setEditingNoteId(rs.id); setNoteDraft(rs.notes); }}
                                className="text-xs text-amber-700 hover:underline flex-shrink-0"
                              >
                                Edit
                              </button>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => { setEditingNoteId(rs.id); setNoteDraft(""); }}
                            className="text-xs sm:text-sm text-amber-700 hover:underline"
                          >
                            Add a note
                          </button>
                        )}
                      </div>
                    )}
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
