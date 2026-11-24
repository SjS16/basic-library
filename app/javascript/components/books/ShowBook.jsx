import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { getAuthHeaders } from "../../utils/csrf";

function ShowBook() {
  const [book, setBook] = useState({});
  const [myRequests, setMyRequests] = useState([]);
  const [requestError, setRequestError] = useState("");
  const [requestBusy, setRequestBusy] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();
  const currentUser = useCurrentUser();
  const isOwner = !!currentUser?.owner;
  const myBorrowerId = currentUser?.borrower_id;

  const fetchBook = () => {
    if (!id) return;
    fetch(`/books/${id}.json`)
      .then((res) => res.json())
      .then((data) => setBook(data))
      .catch((err) => console.error("Error fetching book:", err));
  };

  useEffect(fetchBook, [id]);

  const fetchMyRequests = () => {
    fetch("/borrow_requests.json")
      .then((res) => (res.ok ? res.json() : { borrow_requests: [] }))
      .then((data) => setMyRequests(data.borrow_requests || []))
      .catch(() => {});
  };

  useEffect(() => {
    if (myBorrowerId) fetchMyRequests();
  }, [myBorrowerId]);

  // The member's live request for this book, if any. Declined and
  // cancelled requests do not block asking again.
  const myRequest = myRequests.find(
    (r) => r.book?.id === Number(id) && (r.status === "pending" || r.status === "approved")
  );
  const lastDeclined =
    !myRequest && myRequests.find((r) => r.book?.id === Number(id) && r.status === "declined");

  const handleRequest = async () => {
    setRequestError("");
    setRequestBusy(true);
    try {
      const res = await fetch("/borrow_requests.json", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ borrow_request: { book_id: book.id } }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setRequestError(data.error || "Could not send the request.");
    } catch (err) {
      setRequestError("Could not send the request.");
    }
    setRequestBusy(false);
    fetchMyRequests();
  };

  const handleCancelRequest = async (requestId) => {
    try {
      await fetch(`/borrow_requests/${requestId}/cancel.json`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
    } catch (err) {
      // The refreshed list below shows the true state either way.
    }
    fetchMyRequests();
  };

  // Owner lending, straight from the book page: pick an existing
  // member, or quick-add someone by name only (no account needed).
  const [members, setMembers] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [quickName, setQuickName] = useState("");
  const [nameMatches, setNameMatches] = useState(null);
  const [checkoutError, setCheckoutError] = useState("");
  const [checkoutBusy, setCheckoutBusy] = useState(false);

  const fetchMembers = () => {
    fetch("/borrowers.json")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setMembers(data))
      .catch(() => {});
  };

  useEffect(() => {
    if (isOwner) fetchMembers();
  }, [isOwner]);

  const errorText = (data) => {
    if (data && typeof data === "object") {
      const messages = Object.values(data).flat().filter(Boolean);
      if (messages.length > 0) return messages.join(" ");
    }
    return "";
  };

  const checkoutTo = async (borrowerId) => {
    setCheckoutError("");
    setCheckoutBusy(true);
    try {
      const res = await fetch(`/borrowers/${borrowerId}/checkout_book.json`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ book_id: book.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCheckoutError(errorText(data) || "Could not check out the book.");
      } else {
        setNameMatches(null);
        setQuickName("");
        setSelectedMemberId("");
        fetchBook();
      }
    } catch (err) {
      setCheckoutError("Could not check out the book.");
    }
    setCheckoutBusy(false);
  };

  const createAndCheckout = async (name) => {
    setCheckoutError("");
    setCheckoutBusy(true);
    try {
      const res = await fetch("/borrowers.json", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ borrower: { name, standing: 100 } }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCheckoutError(errorText(data) || "Could not add that member.");
        setCheckoutBusy(false);
        return;
      }
      fetchMembers();
      await checkoutTo(data.id);
    } catch (err) {
      setCheckoutError("Could not add that member.");
      setCheckoutBusy(false);
    }
  };

  // Before creating a name-only member, check for a same-name member
  // or an account with that name, and warn if either exists.
  const handleQuickAdd = async () => {
    const name = quickName.trim();
    if (!name) return;
    setCheckoutError("");
    setCheckoutBusy(true);
    try {
      const res = await fetch(`/borrowers/name_check.json?name=${encodeURIComponent(name)}`);
      const data = await res.json().catch(() => ({}));
      if (res.ok && ((data.borrowers || []).length > 0 || (data.accounts || []).length > 0)) {
        setNameMatches(data);
        setCheckoutBusy(false);
        return;
      }
    } catch (err) {
      // If the check itself fails, fall through and add the member.
    }
    setCheckoutBusy(false);
    createAndCheckout(name);
  };

  const handleReturn = async () => {
    const borrowerId = book.current_loan?.borrower?.id;
    if (!borrowerId) return;
    setCheckoutError("");
    setCheckoutBusy(true);
    try {
      const res = await fetch(`/borrowers/${borrowerId}/return_book.json`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ book_id: book.id }),
      });
      if (!res.ok) setCheckoutError("Could not mark the book returned.");
      else fetchBook();
    } catch (err) {
      setCheckoutError("Could not mark the book returned.");
    }
    setCheckoutBusy(false);
  };

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
          {isOwner && (
            <button
              className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-amber-800 text-amber-50 rounded hover:bg-amber-900 shadow text-sm sm:text-base"
              onClick={() => navigate(`/books/${book.id}/edit`)}
            >
              Edit Book
            </button>
          )}
        </div>

        {/* Right side - Book info */}
        <div className="w-full lg:w-1/2 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-4 mb-4 sm:mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold">{book.title}</h1>
            {book.id && !book.in_library ? (
              <span className="px-2 sm:px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs sm:text-sm font-semibold self-start border border-gray-400">
                Not in the library
              </span>
            ) : book.available ? (
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
            {book.member_rating?.count > 0 && (
              <InfoField
                label="Member rating"
                value={`${"★".repeat(Math.round(book.member_rating.average))}${"☆".repeat(5 - Math.round(book.member_rating.average))} ${book.member_rating.average} (${book.member_rating.count} member${book.member_rating.count === 1 ? "" : "s"})`}
              />
            )}

            {book.id && book.in_library && !book.available && book.current_loan?.borrower && (
              <div>
                <h2 className="text-xs sm:text-sm font-semibold text-gray-600 uppercase mb-1">
                  Checked out to
                </h2>
                <p className="text-gray-900 text-base sm:text-lg">
                  {isOwner ? (
                    <Link
                      to={`/borrowers/${book.current_loan.borrower.id}`}
                      className="text-amber-800 underline hover:no-underline font-medium"
                    >
                      {book.current_loan.borrower.name}
                    </Link>
                  ) : myBorrowerId === book.current_loan.borrower.id ? (
                    "You"
                  ) : (
                    "Another member"
                  )}
                  <span className="text-gray-500 text-sm sm:text-base">
                    {" "}· due {new Date(book.current_loan.due_date).toLocaleDateString()}
                  </span>
                </p>
                {isOwner && (
                  <>
                    <button
                      onClick={handleReturn}
                      disabled={checkoutBusy}
                      className="mt-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 text-sm font-medium disabled:opacity-50"
                    >
                      Mark returned
                    </button>
                    {checkoutError && <p className="text-sm text-red-700 mt-2">{checkoutError}</p>}
                  </>
                )}
              </div>
            )}

            {book.description && (
              <div>
                <h2 className="text-xs sm:text-sm font-semibold text-gray-600 uppercase mb-2">
                  Description
                </h2>
                <p className="text-gray-700 leading-relaxed text-sm sm:text-base">{book.description}</p>
              </div>
            )}
          </div>

          {/* Borrow request panel (members only; the owner manages
              requests from the Requests page) */}
          {book.id && !book.in_library && (
            <div className="mt-6 sm:mt-8 p-4 bg-gray-50 border border-gray-200 rounded">
              <p className="text-sm sm:text-base text-gray-700">
                This book is on a member's wish list. The library doesn't own a copy yet.
              </p>
            </div>
          )}

          {book.id && book.in_library && !isOwner && (
            <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t">
              {!currentUser ? (
                <p className="text-sm sm:text-base text-gray-500">Loading…</p>
              ) : !myBorrowerId ? (
                <p className="text-sm sm:text-base text-gray-600">
                  Your account isn't linked to a member record yet, so you can't request books.
                  You can ask to join from your Profile page, or use an invite link from the owner if you have one.
                </p>
              ) : myRequest?.status === "pending" ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded">
                  <p className="font-semibold text-amber-900">Borrow request sent</p>
                  <p className="text-sm text-amber-800 mt-1">
                    The owner has been notified. Once they approve it, the book is officially checked out to you.
                  </p>
                  <button
                    onClick={() => handleCancelRequest(myRequest.id)}
                    className="mt-3 px-4 py-2 text-sm bg-white border border-amber-300 text-amber-900 rounded hover:bg-amber-100"
                  >
                    Cancel request
                  </button>
                </div>
              ) : myRequest?.status === "approved" ? (
                <div className="p-4 bg-green-50 border border-green-200 rounded">
                  <p className="font-semibold text-green-900">On loan to you</p>
                  <p className="text-sm text-green-800 mt-1">
                    Your request was approved and this book is checked out to you. You'll find it under your current loans.
                  </p>
                </div>
              ) : (
                <div>
                  {lastDeclined && (
                    <p className="text-sm text-red-700 mb-2">
                      Your last request for this book was declined. You can ask again.
                    </p>
                  )}
                  {!book.available && (
                    <p className="text-sm text-gray-600 mb-2">
                      This book is currently checked out. You can still request it, and the owner can lend it once it's back.
                    </p>
                  )}
                  <button
                    onClick={handleRequest}
                    disabled={requestBusy}
                    className="px-6 py-3 bg-amber-800 text-amber-50 rounded hover:bg-amber-900 shadow text-sm sm:text-base font-medium disabled:opacity-50"
                  >
                    {requestBusy ? "Sending…" : "Request to Borrow"}
                  </button>
                  {requestError && <p className="text-sm text-red-700 mt-2">{requestError}</p>}
                  <p className="text-xs sm:text-sm text-gray-500 mt-2">
                    Requesting doesn't check the book out. The owner approves requests, and approval is what checks it out to you.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Owner lending panel, for available books. When the book
              is out, the return action lives with the Checked out
              to line above instead. */}
          {book.id && book.in_library && isOwner && book.available && (
            <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t">
              <h2 className="text-lg font-bold mb-3">Lend this book</h2>
              <div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <select
                      value={selectedMemberId}
                      onChange={(e) => setSelectedMemberId(e.target.value)}
                      className="flex-1 px-3 py-2 text-sm sm:text-base border border-gray-300 rounded"
                    >
                      <option value="">Choose a member…</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}{m.email ? ` (${m.email})` : ""}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => selectedMemberId && checkoutTo(Number(selectedMemberId))}
                      disabled={!selectedMemberId || checkoutBusy}
                      className="px-4 py-2 bg-amber-800 text-amber-50 rounded hover:bg-amber-900 text-sm font-medium disabled:opacity-50"
                    >
                      Check out
                    </button>
                  </div>

                  <div className="flex items-center gap-3 my-4">
                    <span className="flex-1 border-t" />
                    <span className="text-xs text-gray-500 uppercase">or someone new</span>
                    <span className="flex-1 border-t" />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      value={quickName}
                      onChange={(e) => { setQuickName(e.target.value); setNameMatches(null); }}
                      placeholder="Name only, no account needed"
                      className="flex-1 px-3 py-2 text-sm sm:text-base border border-gray-300 rounded"
                    />
                    <button
                      onClick={handleQuickAdd}
                      disabled={!quickName.trim() || checkoutBusy}
                      className="px-4 py-2 bg-amber-800 text-amber-50 rounded hover:bg-amber-900 text-sm font-medium disabled:opacity-50"
                    >
                      Quick add &amp; check out
                    </button>
                  </div>

                  {nameMatches && (
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded">
                      <p className="text-sm font-semibold text-amber-900">Wait, this name looks familiar</p>
                      {nameMatches.borrowers.map((b) => (
                        <div key={b.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-2">
                          <p className="text-sm text-amber-900">
                            <span className="font-medium">{b.name}</span> is already a member{b.email ? ` (${b.email})` : ""}.
                          </p>
                          <button
                            onClick={() => checkoutTo(b.id)}
                            disabled={checkoutBusy}
                            className="px-3 py-1.5 bg-amber-800 text-amber-50 rounded hover:bg-amber-900 text-sm font-medium disabled:opacity-50 whitespace-nowrap"
                          >
                            Lend to them instead
                          </button>
                        </div>
                      ))}
                      {nameMatches.accounts.map((u) => (
                        <p key={u.id} className="text-sm text-amber-900 mt-2">
                          <span className="font-medium">{u.name}</span> has an account ({u.email_address})
                          {u.member
                            ? " and is already a member."
                            : ", but is not a member yet. A name-only record will not connect to their account; the invite tools on the Members page link accounts properly."}
                        </p>
                      ))}
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => createAndCheckout(quickName.trim())}
                          disabled={checkoutBusy}
                          className="px-3 py-1.5 bg-white border border-amber-300 text-amber-900 rounded hover:bg-amber-100 text-sm font-medium disabled:opacity-50"
                        >
                          Add anyway &amp; check out
                        </button>
                        <button
                          onClick={() => setNameMatches(null)}
                          className="px-3 py-1.5 text-amber-900 text-sm hover:underline"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {checkoutError && <p className="text-sm text-red-700 mt-2">{checkoutError}</p>}
              </div>
            </div>
          )}

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
