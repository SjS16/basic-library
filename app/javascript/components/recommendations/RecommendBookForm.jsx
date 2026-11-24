import React, { useState, useEffect } from "react";
import { getAuthHeaders } from "../../utils/csrf";
import { useOpenLibrarySearch } from "../../hooks/useOpenLibrarySearch";
import { fetchBookDetails } from "../../utils/openLibraryApi";
import SearchResults from "../books/SearchResults";

// Recommend a book to another member. The book can be one the
// library already has (fixedBook, passed from its book page) or
// any book Open Library knows, found with the same search the
// reading list uses. A recommendation is a title, not a copy:
// the recipient decides whether it joins their to-be-read list,
// where it resolves against the shelves like any other wish.
function RecommendBookForm({ fixedBook = null }) {
  const [recipients, setRecipients] = useState([]);
  const [recipientsLoaded, setRecipientsLoaded] = useState(false);
  const [recipientId, setRecipientId] = useState("");
  const [note, setNote] = useState("");
  const [title, setTitle] = useState(fixedBook?.title || "");
  const [author, setAuthor] = useState(fixedBook?.author || "");
  const [searchTerm, setSearchTerm] = useState("");
  const { searchResults, clearResults } = useOpenLibrarySearch(searchTerm);
  const [picked, setPicked] = useState(null);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetch("/recommendations/recipients.json")
      .then((res) => (res.ok ? res.json() : { recipients: [] }))
      .then((data) => setRecipients(data.recipients || []))
      .catch(() => {})
      .finally(() => setRecipientsLoaded(true));
  }, []);

  const handleTitleChange = (value) => {
    setTitle(value);
    setSearchTerm(value);
  };

  const handleLookupSelect = async (result) => {
    const details = await fetchBookDetails(result);
    setTitle(details.title || "");
    setAuthor(details.author || "");
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setSending(true);
    try {
      // If the book was picked from the Open Library suggestions
      // and the fields still match the pick, its ISBN and cover
      // ride along so the match can use the ISBN.
      const stillPicked = picked && picked.title === title && picked.author === author;
      const bookPayload = fixedBook
        ? { id: fixedBook.id }
        : stillPicked
          ? { title, author, isbn: picked.isbn, cover_url: picked.cover_url }
          : { title, author };
      const res = await fetch("/recommendations.json", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          recommendation: { recipient_id: recipientId, note },
          book: bookPayload,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        const name = recipients.find((r) => r.id === Number(recipientId))?.name || "them";
        setMessage({
          kind: "ok",
          text: `Recommended “${title}” to ${name}. It is waiting in their recommendations; if they accept, it joins their to-be-read list.`,
        });
        setNote("");
        if (!fixedBook) {
          setTitle("");
          setAuthor("");
          setPicked(null);
        }
      } else {
        setMessage({ kind: "error", text: data.error || "Could not send the recommendation." });
      }
    } catch (err) {
      setMessage({ kind: "error", text: "Could not send the recommendation." });
    }
    setSending(false);
  };

  const inputClasses =
    "w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-transparent bg-white";

  if (recipientsLoaded && recipients.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        There is nobody else in the library to recommend a book to yet.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-3">
      {!fixedBook && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
          <div className="relative">
            <input
              type="text"
              required
              placeholder="Title *"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className={inputClasses}
            />
            <div className="absolute left-0 right-0 top-full z-30 mt-1">
              <SearchResults results={searchResults} onSelect={handleLookupSelect} onDismiss={handleDismissSearch} />
            </div>
          </div>
          <input
            type="text"
            required
            placeholder="Author *"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className={inputClasses}
          />
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
        <select
          value={recipientId}
          onChange={(e) => setRecipientId(e.target.value)}
          required
          className={inputClasses}
        >
          <option value="">Recommend to…</option>
          {recipients.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Why they'd like it (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className={inputClasses}
        />
      </div>
      <button
        type="submit"
        disabled={sending || !recipientId || (!fixedBook && (!title.trim() || !author.trim()))}
        className="px-4 py-2 text-sm sm:text-base bg-amber-800 text-amber-50 rounded-lg hover:bg-amber-900 disabled:bg-gray-300 transition-colors"
      >
        {sending ? "Sending…" : "Send recommendation"}
      </button>
      {message && (
        <p className={`text-xs sm:text-sm ${message.kind === "ok" ? "text-green-700" : "text-red-700"}`}>
          {message.text}
        </p>
      )}
    </form>
  );
}

export default RecommendBookForm;
