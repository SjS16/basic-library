import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { getAuthHeaders } from "../utils/csrf";
import { useOpenLibrarySearch } from "../hooks/useOpenLibrarySearch";
import { fetchBookDetails } from "../utils/openLibraryApi";
import SearchResults from "./books/SearchResults";

function RequestsPage() {
  const currentUser = useCurrentUser();
  const isOwner = !!currentUser?.owner;
  const isMember = !!currentUser?.borrower_id;
  const [requests, setRequests] = useState([]);
  const [joinRequests, setJoinRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [joinError, setJoinError] = useState("");
  const [joinBusy, setJoinBusy] = useState(false);
  const [reqTitle, setReqTitle] = useState("");
  const [reqAuthor, setReqAuthor] = useState("");
  const [reqNotice, setReqNotice] = useState(null);
  const [reqError, setReqError] = useState("");
  const [reqBusy, setReqBusy] = useState(false);
  const [reqSearchTerm, setReqSearchTerm] = useState("");
  const { searchResults: reqResults, clearResults: clearReqResults } = useOpenLibrarySearch(reqSearchTerm);
  const [reqPicked, setReqPicked] = useState(null);

  const fetchAll = () => {
    Promise.all([
      fetch("/borrow_requests.json")
        .then((res) => (res.ok ? res.json() : { borrow_requests: [] }))
        .catch(() => ({ borrow_requests: [] })),
      fetch("/membership_requests.json")
        .then((res) => (res.ok ? res.json() : { membership_requests: [] }))
        .catch(() => ({ membership_requests: [] })),
    ]).then(([borrowData, joinData]) => {
      setRequests(borrowData.borrow_requests || []);
      setJoinRequests(joinData.membership_requests || []);
      setLoading(false);
    });
  };

  useEffect(fetchAll, []);

  const act = async (id, action) => {
    setErrors((prev) => ({ ...prev, [id]: "" }));
    try {
      const res = await fetch(`/borrow_requests/${id}/${action}.json`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrors((prev) => ({ ...prev, [id]: data.error || "Something went wrong." }));
      }
    } catch (err) {
      setErrors((prev) => ({ ...prev, [id]: "Something went wrong." }));
    }
    fetchAll();
  };

  const actJoin = async (id, action) => {
    const key = `join-${id}`;
    setErrors((prev) => ({ ...prev, [key]: "" }));
    try {
      const res = await fetch(`/membership_requests/${id}/${action}.json`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrors((prev) => ({ ...prev, [key]: data.error || "Something went wrong." }));
      }
    } catch (err) {
      setErrors((prev) => ({ ...prev, [key]: "Something went wrong." }));
    }
    fetchAll();
  };

  const askToJoin = async () => {
    setJoinError("");
    setJoinBusy(true);
    try {
      const res = await fetch("/membership_requests.json", {
        method: "POST",
        headers: getAuthHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setJoinError(data.error || "Could not send the request.");
    } catch (err) {
      setJoinError("Could not send the request.");
    }
    setJoinBusy(false);
    fetchAll();
  };

  // The same Open Library search the other add forms use: picking
  // a suggestion fills the author and carries the ISBN, so the
  // server can match the request to the library's copy by ISBN.
  const handleReqTitleChange = (value) => {
    setReqTitle(value);
    setReqSearchTerm(value);
  };

  const handleReqSelect = async (result) => {
    const details = await fetchBookDetails(result);
    setReqTitle(details.title || "");
    setReqAuthor(details.author || "");
    setReqPicked({
      title: details.title || "",
      author: details.author || "",
      isbn: details.isbn || "",
    });
    clearReqResults();
    setReqSearchTerm("");
  };

  const handleReqDismiss = () => {
    clearReqResults();
    setReqSearchTerm("");
  };

  const submitTitleRequest = async (e) => {
    e.preventDefault();
    setReqError("");
    setReqNotice(null);
    setReqBusy(true);
    try {
      const res = await fetch(`/borrowers/${currentUser.borrower_id}/title_requests.json`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          book: {
            title: reqTitle,
            author: reqAuthor,
            ...(reqPicked && reqPicked.title === reqTitle && reqPicked.author === reqAuthor
              ? { isbn: reqPicked.isbn }
              : {}),
          },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setReqError(data.error || "Something went wrong.");
      } else if (data.outcome === "requested") {
        setReqNotice({
          kind: "found",
          text: `Requested: the library has "${data.book.title}" by ${data.book.author}. Your request is waiting for the owner.`,
        });
        setReqTitle("");
        setReqAuthor("");
      } else if (data.outcome === "wishlisted") {
        setReqNotice({
          kind: "wish",
          text: `"${data.book.title}" isn't in the library yet, so it's on your Want to Read list as a wish. If the owner adds a copy, your entry will point at it.`,
        });
        setReqTitle("");
        setReqAuthor("");
      } else {
        setReqNotice({
          kind: "wish",
          text: `"${data.book.title}" is already on your reading list.`,
        });
      }
    } catch (err) {
      setReqError("Something went wrong.");
    }
    setReqBusy(false);
    fetchAll();
  };

  const statusChip = (status) => {
    const config = {
      pending: { classes: "bg-amber-100 text-amber-900 border-amber-900", label: "Pending" },
      approved: { classes: "bg-green-100 text-green-900 border-green-900", label: "Approved" },
      accepted: { classes: "bg-green-100 text-green-900 border-green-900", label: "Approved" },
      declined: { classes: "bg-red-100 text-red-900 border-red-900", label: "Declined" },
      cancelled: { classes: "bg-gray-100 text-gray-700 border-gray-400", label: "Cancelled" },
    };
    const c = config[status] || config.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${c.classes}`}>
        {c.label}
      </span>
    );
  };

  if (!currentUser || loading) {
    return <p className="text-gray-600">Loading…</p>;
  }

  // Signed in but not a member: this page is where they ask to join.
  if (!isOwner && !isMember) {
    const myJoin = joinRequests[0];
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-black mb-2 text-amber-950">Join this library</h1>
        <p className="text-gray-600 mb-6 sm:mb-8">
          Membership is granted by the library's owner, so the books stay within their circle.
          Ask to join and the owner gets a notification. Once they approve, you can request
          books and keep your own reading lists.
        </p>
        <div className="bg-white rounded shadow p-6">
          {myJoin?.status === "pending" ? (
            <>
              <p className="font-semibold text-amber-900">Request sent</p>
              <p className="text-sm text-gray-600 mt-1">
                Waiting for the owner to approve it. This page becomes your requests page
                once you're a member.
              </p>
            </>
          ) : (
            <>
              {myJoin?.status === "declined" && (
                <p className="text-sm text-red-700 mb-2">
                  Your last request to join was declined. You can ask again.
                </p>
              )}
              <button
                onClick={askToJoin}
                disabled={joinBusy}
                className="px-6 py-3 bg-amber-800 text-amber-50 rounded hover:bg-amber-900 font-medium disabled:opacity-50"
              >
                {joinBusy ? "Sending…" : "Ask to join this library"}
              </button>
              {joinError && <p className="text-sm text-red-700 mt-2">{joinError}</p>}
              <p className="text-xs sm:text-sm text-gray-500 mt-3">
                Have an invite link from the owner, or an invite waiting? Check your Profile
                page. Opening an invite link while signed in adds you right away.
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  const pending = requests.filter((r) => r.status === "pending");
  const handled = requests.filter((r) => r.status !== "pending");
  const pendingJoins = joinRequests.filter((r) => r.status === "pending");
  const handledJoins = joinRequests.filter((r) => r.status !== "pending");

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl sm:text-4xl font-black mb-2 text-amber-950">
        {isOwner ? "Requests" : "My Borrow Requests"}
      </h1>
      <p className="text-gray-600 mb-6 sm:mb-8">
        {isOwner
          ? "People asking to join the library, and members asking to borrow books. Approving a borrow request checks the book out to them right away."
          : "Books you've asked to borrow. A request becomes a real checkout when the owner approves it."}
      </p>

      {isOwner && (
        <>
          <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
            Membership requests ({pendingJoins.length})
          </h2>
          {pendingJoins.length === 0 ? (
            <p className="text-gray-500 bg-white rounded shadow p-4 sm:p-6 mb-6 sm:mb-8">
              No one is waiting to join.
            </p>
          ) : (
            <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
              {pendingJoins.map((r) => (
                <div key={r.id} className="bg-white rounded shadow p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-base sm:text-lg truncate">
                        {r.user.name || r.user.email_address}
                      </p>
                      <p className="text-sm text-gray-600 truncate">{r.user.email_address}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Asked to join {new Date(r.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => actJoin(r.id, "approve")}
                        className="px-4 py-2 bg-amber-800 text-amber-50 rounded hover:bg-amber-900 text-sm font-medium"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => actJoin(r.id, "decline")}
                        className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 text-sm font-medium"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                  {errors[`join-${r.id}`] && (
                    <p className="text-sm text-red-700 mt-2">{errors[`join-${r.id}`]}</p>
                  )}
                </div>
              ))}
            </div>
          )}
          {handledJoins.length > 0 && (
            <div className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
              {handledJoins.map((r) => (
                <div
                  key={r.id}
                  className="bg-white rounded shadow p-3 sm:p-4 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {r.user.name || r.user.email_address}
                      <span className="text-gray-500 font-normal"> · {r.user.email_address}</span>
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500">
                      Asked {new Date(r.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {statusChip(r.status)}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Borrow requests waiting ({pending.length})</h2>
      {pending.length === 0 ? (
        <p className="text-gray-500 bg-white rounded shadow p-4 sm:p-6 mb-6 sm:mb-8">
          {isOwner
            ? "No borrow requests waiting. You're all caught up."
            : "Nothing waiting. Use the form below, or find a book in the library and choose Request to Borrow."}
        </p>
      ) : (
        <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
          {pending.map((r) => (
            <div key={r.id} className="bg-white rounded shadow p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-base sm:text-lg truncate">{r.book.title}</p>
                  <p className="text-sm text-gray-600 truncate">{r.book.author}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {isOwner && r.borrower && (
                      <>
                        Requested by{" "}
                        <Link to={`/borrowers/${r.borrower.id}`} className="text-amber-800 underline hover:no-underline">
                          {r.borrower.name}
                        </Link>{" "}
                        ·{" "}
                      </>
                    )}
                    {new Date(r.created_at).toLocaleDateString()}
                  </p>
                  {isOwner && !r.book.available && (
                    <p className="text-sm text-amber-700 mt-1">
                      This book is currently checked out, so it can't be lent until it's back.
                    </p>
                  )}
                  {isOwner && r.borrower?.overdue_books_count > 0 && (
                    <p className="text-sm font-semibold text-red-700 mt-1">
                      ⚠ {r.borrower.name} has {r.borrower.overdue_books_count} {r.borrower.overdue_books_count === 1 ? "book" : "books"} overdue right now.
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isOwner ? (
                    <>
                      <button
                        onClick={() => act(r.id, "approve")}
                        className="px-4 py-2 bg-amber-800 text-amber-50 rounded hover:bg-amber-900 text-sm font-medium"
                      >
                        Approve &amp; lend
                      </button>
                      <button
                        onClick={() => act(r.id, "decline")}
                        className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 text-sm font-medium"
                      >
                        Decline
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => act(r.id, "cancel")}
                      className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 text-sm font-medium"
                    >
                      Cancel request
                    </button>
                  )}
                </div>
              </div>
              {errors[r.id] && <p className="text-sm text-red-700 mt-2">{errors[r.id]}</p>}
            </div>
          ))}
        </div>
      )}

      {handled.length > 0 && (
        <>
          <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Earlier borrow requests</h2>
          <div className="space-y-2 sm:space-y-3">
            {handled.map((r) => (
              <div
                key={r.id}
                className="bg-white rounded shadow p-3 sm:p-4 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">
                    {r.book.title}
                    <span className="text-gray-500 font-normal"> · {r.book.author}</span>
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500">
                    {isOwner && r.borrower ? `${r.borrower.name} · ` : ""}
                    {new Date(r.created_at).toLocaleDateString()}
                  </p>
                </div>
                {statusChip(r.status)}
              </div>
            ))}
          </div>
        </>
      )}

      {isMember && !isOwner && (
        <div className="bg-white rounded shadow p-4 sm:p-6 mt-6 sm:mt-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-2">Request a book by title</h2>
          <p className="text-sm text-gray-600 mb-4">
            Know exactly what you want? Ask for it here. If the library has it, the request
            goes straight to the owner. If nobody has it yet, it lands on your Want to Read
            list as a wish instead.
          </p>
          {reqNotice && (
            <div
              className={`border rounded-lg p-3 sm:p-4 mb-4 ${
                reqNotice.kind === "found"
                  ? "bg-green-50 border-green-300 text-green-900"
                  : "bg-amber-50 border-amber-300 text-amber-900"
              }`}
            >
              <p className="text-sm font-medium">{reqNotice.text}</p>
            </div>
          )}
          <form onSubmit={submitTitleRequest} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={reqTitle}
                  onChange={(e) => handleReqTitleChange(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-transparent"
                  placeholder="Start typing to search Open Library"
                />
                <div className="absolute left-0 right-0 top-full z-30 mt-1">
                  <SearchResults results={reqResults} onSelect={handleReqSelect} onDismiss={handleReqDismiss} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Author *</label>
                <input
                  type="text"
                  value={reqAuthor}
                  onChange={(e) => setReqAuthor(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-transparent"
                  placeholder="Author"
                />
              </div>
            </div>
            {reqError && <p className="text-sm text-red-700">{reqError}</p>}
            <button
              type="submit"
              disabled={reqBusy}
              className="px-4 py-2 bg-amber-800 text-amber-50 rounded-lg hover:bg-amber-900 text-sm font-medium disabled:opacity-50"
            >
              {reqBusy ? "Asking…" : "Request this book"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default RequestsPage;
