import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useCurrentUser, useCurrentUserLoaded } from "../hooks/useCurrentUser";
import { getAuthHeaders } from "../utils/csrf";

// The six most recently added books, newest first. (The index
// returns books in id order, so an unsorted slice would show the
// oldest books as "recent".)
function recentSix(books) {
  return [...books]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 6);
}

function RecentBooks({ books }) {
  const recent = recentSix(books);
  if (recent.length === 0) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-10">
        <h2 className="text-3xl sm:text-4xl font-serif font-bold text-amber-950 mb-3 border-b-2 border-amber-900 inline-block pb-2">Recent Acquisitions</h2>
        <p className="text-lg text-amber-900 font-serif italic mt-4">The six newest additions to the collection</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {recent.map((book) => (
          <Link key={book.id} to={`/books/${book.id}`} className="group">
            <div className="bg-amber-50 border-2 border-amber-900 shadow-md overflow-hidden hover:shadow-xl transition-all h-full">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-serif font-bold text-amber-950 group-hover:text-amber-800 transition-colors line-clamp-2">
                    {book.title}
                  </h3>
                  {book.available ? (
                    <span className="inline-flex items-center px-3 py-1 text-xs font-serif font-semibold bg-amber-100 text-amber-900 border border-amber-900">
                      In
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 text-xs font-serif font-semibold bg-red-100 text-red-900 border border-red-900">
                      Out
                    </span>
                  )}
                </div>
                <p className="text-sm text-amber-900 mb-2 font-serif italic">by {book.author}</p>
                {book.description && (
                  <p className="text-sm text-amber-800 line-clamp-3">{book.description}</p>
                )}
                <div className="mt-4 flex items-center justify-between border-t border-amber-900 pt-3">
                  {book.genre && (
                    <span className="text-xs text-amber-900 font-serif font-semibold">{book.genre}</span>
                  )}
                  {book.published_year && (
                    <span className="text-xs text-amber-700 font-serif">{book.published_year}</span>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="text-center">
        <Link to="/books" className="inline-flex items-center px-6 py-3 text-base font-serif font-semibold text-amber-900 hover:text-amber-800 border-b-2 border-amber-900 hover:border-amber-800 transition-colors">
          Browse Complete Catalogue →
        </Link>
      </div>
    </div>
  );
}

function daysOverdue(loan) {
  const diff = Date.now() - new Date(loan.due_date).getTime();
  return Math.max(1, Math.floor(diff / 86400000));
}

// What a member sees: their own overdue books first, then everything
// they currently have out, then what's new. Nothing about anyone else.
function MemberHome({ currentUser, books }) {
  const [loans, setLoans] = useState(null);

  useEffect(() => {
    if (!currentUser?.borrower_id) return;
    fetch(`/borrowers/${currentUser.borrower_id}.json`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setLoans(data?.current_loans || []))
      .catch(() => setLoans([]));
  }, [currentUser?.borrower_id]);

  const overdue = (loans || []).filter((loan) => new Date(loan.due_date) < new Date());
  // Books already shown in the overdue panel don't repeat below.
  const onLoan = (loans || []).filter((loan) => !(new Date(loan.due_date) < new Date()));

  return (
    <>
      {loans !== null && overdue.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
          <div className="bg-red-50 border-2 border-red-900 shadow-lg p-6">
            <h2 className="text-2xl font-serif font-bold text-red-950 mb-4">
              Overdue ({overdue.length})
            </h2>
            <div className="space-y-3">
              {overdue.map((loan) => (
                <div key={loan.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 bg-white border border-red-300 p-4">
                  <div className="min-w-0">
                    <Link to={`/books/${loan.book.id}`} className="font-serif font-bold text-amber-950 hover:text-amber-800 hover:underline">
                      {loan.book.title}
                    </Link>
                    <p className="text-sm text-gray-600">by {loan.book.author}</p>
                  </div>
                  <p className="text-sm font-semibold text-red-800 whitespace-nowrap">
                    Due {new Date(loan.due_date).toLocaleDateString()} · {daysOverdue(loan)}d overdue
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {(loans === null || loans.length === 0 || onLoan.length > 0) && (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <div className="bg-amber-50 border-2 border-amber-900 shadow-lg p-6">
          <h2 className="text-2xl font-serif font-bold text-amber-950 mb-4">
            Books You Have Borrowed{loans !== null ? ` (${onLoan.length})` : ""}
          </h2>
          {loans === null ? (
            <p className="text-amber-900 font-serif italic">Loading…</p>
          ) : loans.length === 0 ? (
            <p className="text-amber-900 font-serif italic">
              Nothing checked out right now. Browse the catalogue and request anything that catches your eye.
            </p>
          ) : (
            <div className="space-y-3">
              {onLoan.map((loan) => (
                <div key={loan.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 bg-white border border-amber-200 p-4">
                  <div className="min-w-0">
                    <Link to={`/books/${loan.book.id}`} className="font-serif font-bold text-amber-950 hover:text-amber-800 hover:underline">
                      {loan.book.title}
                    </Link>
                    <p className="text-sm text-gray-600">by {loan.book.author}</p>
                  </div>
                  <p className="text-sm whitespace-nowrap text-gray-600">
                    Due {new Date(loan.due_date).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      )}

      <RecentBooks books={books} />
    </>
  );
}

// What the owner sees: the collection at a glance, anything waiting
// on her, then what's new.
function OwnerHome({ books }) {
  const [memberCount, setMemberCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [overdueLoans, setOverdueLoans] = useState([]);
  const [nudgedIds, setNudgedIds] = useState([]);
  const [botherError, setBotherError] = useState("");

  useEffect(() => {
    fetch("/borrowers.json")
      .then((res) => (res.ok ? res.json() : []))
      .then((borrowers) => setMemberCount(borrowers.length))
      .catch(() => {});

    Promise.all([
      fetch("/borrow_requests.json").then((res) => (res.ok ? res.json() : [])).catch(() => []),
      fetch("/membership_requests.json").then((res) => (res.ok ? res.json() : [])).catch(() => []),
    ]).then(([borrowRequests, joinRequests]) => {
      const pending =
        borrowRequests.filter((r) => r.status === "pending").length +
        joinRequests.filter((r) => r.status === "pending").length;
      setPendingCount(pending);
    });

    fetch("/loans/overdue.json")
      .then((res) => (res.ok ? res.json() : []))
      .then((loans) => setOverdueLoans(Array.isArray(loans) ? loans : []))
      .catch(() => {});
  }, []);

  const handleBother = async (loan) => {
    setBotherError("");
    try {
      const res = await fetch(`/loans/${loan.id}/bother.json`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        setNudgedIds((prev) => [...prev, loan.id]);
      } else {
        setBotherError(data?.error || "The nudge could not be sent.");
      }
    } catch (err) {
      setBotherError("The nudge could not be sent.");
    }
  };

  const availableCount = books.filter((b) => b.available).length;
  const checkedOutCount = books.length - availableCount;

  const statCard = (label, value, dark) => (
    <div className={`${dark ? "bg-red-50 border-red-900" : "bg-amber-100 border-amber-900"} border-2 shadow-lg p-6`}>
      <p className={`text-sm font-serif font-semibold uppercase tracking-wide ${dark ? "text-red-900" : "text-amber-800"}`}>{label}</p>
      <p className={`text-4xl font-serif font-bold mt-2 ${dark ? "text-red-950" : "text-amber-950"}`}>{value}</p>
    </div>
  );

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCard("Total Volumes", books.length)}
          {statCard("On Shelves", availableCount)}
          {statCard("Members", memberCount)}
          {statCard("Checked Out", checkedOutCount, true)}
        </div>

        {pendingCount > 0 && (
          <Link to="/requests" className="block mt-6 bg-amber-800 text-amber-50 shadow-lg p-5 hover:bg-amber-900 transition-colors">
            <span className="font-serif font-bold text-lg">
              {pendingCount} request{pendingCount === 1 ? "" : "s"} waiting for you →
            </span>
            <span className="block text-sm text-amber-200 mt-1">Borrow requests and join requests live on the Requests page.</span>
          </Link>
        )}

        {overdueLoans.length > 0 && (
          <div className="mt-6 bg-red-50 border-2 border-red-900 shadow-lg p-6">
            <h2 className="text-2xl font-serif font-bold text-red-950 mb-4">
              Overdue at the Library ({overdueLoans.length})
            </h2>
            <div className="space-y-3">
              {overdueLoans.map((loan) => (
                <div key={loan.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-white border border-red-300 p-4">
                  <div className="min-w-0">
                    <Link to={`/books/${loan.book.id}`} className="font-serif font-bold text-amber-950 hover:text-amber-800 hover:underline">
                      {loan.book.title}
                    </Link>
                    <p className="text-sm text-gray-600">
                      with <Link to={`/borrowers/${loan.borrower.id}`} className="hover:underline">{loan.borrower.name}</Link>
                      {" "}· due {new Date(loan.due_date).toLocaleDateString()} · {loan.days_overdue}d overdue
                    </p>
                  </div>
                  {nudgedIds.includes(loan.id) ? (
                    <span className="text-sm font-semibold text-green-700 whitespace-nowrap">Nudge sent ✓</span>
                  ) : loan.borrower.email ? (
                    <button
                      onClick={() => handleBother(loan)}
                      className="px-3 py-1.5 bg-red-800 text-white rounded hover:bg-red-900 text-sm font-medium whitespace-nowrap"
                    >
                      Send a nudge
                    </button>
                  ) : (
                    <span className="text-xs text-gray-500 whitespace-nowrap">No email on file</span>
                  )}
                </div>
              ))}
            </div>
            {botherError && <p className="text-sm text-red-700 mt-3">{botherError}</p>}
          </div>
        )}
      </div>

      <RecentBooks books={books} />
    </>
  );
}

function Home() {
  const currentUser = useCurrentUser();
  const userLoaded = useCurrentUserLoaded();
  const [books, setBooks] = useState([]);

  useEffect(() => {
    fetch("/books.json")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setBooks(Array.isArray(data) ? data : []))
      .catch(() => setBooks([]));
  }, []);

  const isOwner = !!currentUser?.owner;
  const isMember = !!currentUser?.borrower_id;

  return (
    <div className="min-h-screen -mx-4 sm:-mx-6 -mt-8 sm:-mt-12">
      {/* Hero Section */}
      <div className="relative overflow-hidden border-b-4 border-amber-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-serif font-bold text-amber-950 mb-6 tracking-tight" style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.1)" }}>
              My Library
            </h1>
            <p className="text-xl sm:text-2xl text-amber-900 mb-8 max-w-3xl mx-auto font-serif italic">
              A timeless collection of knowledge and stories, carefully curated and preserved.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/books" className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-amber-50 bg-amber-900 hover:bg-amber-800 border-2 border-amber-950 shadow-lg transition-all">
                Browse Collection
              </Link>
              {isOwner && (
                <Link to="/borrowers" className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 border-2 border-amber-900 shadow-lg transition-all">
                  View Members
                </Link>
              )}
              {isMember && !isOwner && (
                <Link to="/my-books" className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 border-2 border-amber-900 shadow-lg transition-all">
                  My Books
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {!userLoaded ? null : isOwner ? (
        <OwnerHome books={books} />
      ) : isMember ? (
        <MemberHome currentUser={currentUser} books={books} />
      ) : (
        <>
          {currentUser && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
              <div className="bg-amber-50 border-2 border-amber-900 shadow-lg p-6 text-center">
                <h2 className="text-2xl font-serif font-bold text-amber-950 mb-2">You're not a member of this library yet</h2>
                <p className="text-amber-900 font-serif italic mb-4">
                  Membership is granted by the owner. If you know her, ask for an invite link, or send a join request.
                </p>
                <Link to="/requests" className="inline-flex items-center px-6 py-3 text-base font-semibold text-amber-50 bg-amber-900 hover:bg-amber-800 border-2 border-amber-950 shadow transition-all">
                  Ask to Join
                </Link>
              </div>
            </div>
          )}
          <RecentBooks books={books} />
        </>
      )}
    </div>
  );
}

export default Home;
