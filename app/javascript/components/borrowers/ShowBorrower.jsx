import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { getAuthHeaders } from "../../utils/csrf";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import ReadingList from "./ReadingList";

function ShowBorrower() {
  const [borrower, setBorrower] = useState(null);
  const [currentLoans, setCurrentLoans] = useState([]);
  const [readingStatuses, setReadingStatuses] = useState([]);
  const [allBooks, setAllBooks] = useState([]);
  const [borrowRequests, setBorrowRequests] = useState([]);
  const [dueEdits, setDueEdits] = useState({});
  const [nudgedIds, setNudgedIds] = useState([]);
  const [loanMsg, setLoanMsg] = useState({});
  const navigate = useNavigate();
  const { id } = useParams();
  const currentUser = useCurrentUser();
  const isOwner = !!currentUser?.owner;
  const viewerIsSelf = !!currentUser?.borrower_id && currentUser.borrower_id === Number(id);

  const fetchBorrowerData = () => {
    if (id) {
      // Fetch borrower with loans and reading statuses
      fetch(`/borrowers/${id}.json`)
        .then((res) => res.json())
        .then((data) => {
          setBorrower(data);
          setCurrentLoans(data.current_loans || []);
          setReadingStatuses(data.reading_statuses || []);
        })
        .catch((err) => console.error("Error fetching borrower:", err));
    }
  };

  // The owner's queue endpoint returns every request; this page
  // shows just this member's slice of it.
  useEffect(() => {
    if (!isOwner) return;
    fetch("/borrow_requests.json")
      .then((res) => (res.ok ? res.json() : { borrow_requests: [] }))
      .then((data) =>
        setBorrowRequests((data.borrow_requests || []).filter((r) => r.borrower?.id === Number(id)))
      )
      .catch(() => {});
  }, [isOwner, id]);

  useEffect(() => {
    fetchBorrowerData();

    // Fetch all books for reading list
    fetch("/books.json")
      .then((res) => res.json())
      .then((data) => {
        setAllBooks(data);
      })
      .catch((err) => console.error("Error fetching books:", err));
  }, [id]);

  const handleReturn = (bookId) => {
    fetch(`/borrowers/${id}/return_book.json`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ book_id: bookId }),
    })
      .then((res) => res.json())
      .then(() => {
        // Refresh data
        window.location.reload();
      })
      .catch((err) => console.error("Error returning book:", err));
  };

  const handleLendBook = (bookId) => {
    fetch(`/borrowers/${id}/checkout_book.json`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ book_id: bookId }),
    })
      .then((res) => res.json())
      .then(() => {
        window.location.reload();
      })
      .catch((err) => console.error("Error lending book:", err));
  };

  const handleDueSave = (loan) => {
    const value = dueEdits[loan.id];
    if (!value) return;
    fetch(`/loans/${loan.id}.json`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({ loan: { due_date: value } }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Could not update the due date.");
        window.location.reload();
      })
      .catch((err) =>
        setLoanMsg((prev) => ({ ...prev, [loan.id]: err.message }))
      );
  };

  const handleNudge = (loan) => {
    fetch(`/loans/${loan.id}/bother.json`, {
      method: "POST",
      headers: getAuthHeaders(),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "The nudge could not be sent.");
        setNudgedIds((prev) => [...prev, loan.id]);
      })
      .catch((err) =>
        setLoanMsg((prev) => ({ ...prev, [loan.id]: err.message }))
      );
  };

  if (!borrower) {
    return <div className="text-center p-12">Loading...</div>;
  }

  const getStandingColor = () => {
    const { standing } = borrower;
    if (standing >= 90) return "green";
    if (standing >= 70) return "blue";
    if (standing >= 50) return "yellow";
    if (standing >= 30) return "orange";
    return "red";
  };

  const colorClasses = {
    green: { bg: "bg-green-100", text: "text-green-800", ring: "ring-green-500" },
    blue: { bg: "bg-blue-100", text: "text-blue-800", ring: "ring-blue-500" },
    yellow: { bg: "bg-yellow-100", text: "text-yellow-800", ring: "ring-yellow-500" },
    orange: { bg: "bg-orange-100", text: "text-orange-800", ring: "ring-orange-500" },
    red: { bg: "bg-red-100", text: "text-red-800", ring: "ring-red-500" },
  };

  const color = getStandingColor();
  const classes = colorClasses[color];

  // Books on this member's want-to-read list that the library owns
  // but are out with someone right now: their informal waitlist.
  const waitingOn = readingStatuses.filter(
    (rs) => rs.status === "want_to_read" && rs.book?.in_library && !rs.book?.available
  );

  const requestStatusChip = (status) => {
    const styles = {
      pending: "bg-amber-100 text-amber-800",
      approved: "bg-green-100 text-green-800",
      declined: "bg-red-100 text-red-800",
      cancelled: "bg-gray-100 text-gray-600",
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold flex-shrink-0 capitalize ${styles[status] || styles.cancelled}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <button
          onClick={() => navigate(isOwner ? "/borrowers" : "/books")}
          className="text-sm sm:text-base text-blue-600 hover:text-blue-800 mb-3 sm:mb-4 inline-flex items-center gap-2"
        >
          {isOwner ? "← Back to Borrowers" : "← Back to Books"}
        </button>
        
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-6">
              <div className={`w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl sm:text-3xl lg:text-4xl font-bold shadow-xl ${classes.ring} ring-2 sm:ring-4 flex-shrink-0`}>
                {borrower.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2 truncate">{borrower.name}</h1>
                {borrower.email && <p className="text-sm sm:text-base text-gray-600 truncate">{borrower.email}</p>}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2 sm:mt-3">
                  <span className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-sm sm:text-base lg:text-lg font-bold ${classes.bg} ${classes.text} inline-block`}>
                    Standing: {borrower.standing}/100
                  </span>
                  <span className="text-xs sm:text-sm text-gray-600">
                    {borrower.standing_status}
                  </span>
                </div>
              </div>
            </div>

            {isOwner && (
              <button
                onClick={() => navigate(`/borrowers/${id}/edit`)}
                className="px-3 sm:px-4 py-2 text-sm sm:text-base text-gray-700 hover:bg-gray-100 rounded-lg transition-colors self-start sm:self-auto"
              >
                Edit
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        {/* Current Loans */}
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
            Current Loans ({currentLoans.length}/5)
          </h2>

          {currentLoans.length === 0 ? (
            <p className="text-sm sm:text-base text-gray-500 text-center py-6 sm:py-8">No books checked out</p>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {currentLoans.map((loan) => {
                const isOverdue = new Date(loan.due_date) < new Date();
                return (
                  <div
                    key={loan.id}
                    className={`p-3 sm:p-4 rounded-lg border-2 ${
                      isOverdue ? "border-red-300 bg-red-50" : "border-gray-200"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm sm:text-base font-bold text-gray-900 truncate">
                          <Link to={`/books/${loan.book.id}`} className="hover:text-amber-800 hover:underline">
                            {loan.book.title}
                          </Link>
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600 truncate">{loan.book.author}</p>
                      </div>
                      {isOverdue && (
                        <span className="px-2 py-1 bg-red-600 text-white text-xs rounded font-semibold flex-shrink-0">
                          OVERDUE
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mb-2 sm:mb-3">
                      Due: {new Date(loan.due_date).toLocaleDateString()}
                    </p>
                    {isOwner && (
                      <div className="space-y-2">
                        <div className="flex flex-col sm:flex-row gap-2">
                          <button
                            onClick={() => handleReturn(loan.book.id)}
                            className="flex-1 px-3 py-2 bg-amber-700 text-amber-50 rounded hover:bg-amber-800 transition-colors text-xs sm:text-sm font-medium"
                          >
                            Return Book
                          </button>
                          {isOverdue &&
                            (nudgedIds.includes(loan.id) ? (
                              <span className="flex-1 px-3 py-2 text-center text-xs sm:text-sm font-semibold text-green-700">
                                Nudge sent ✓
                              </span>
                            ) : (
                              <button
                                onClick={() => handleNudge(loan)}
                                className="flex-1 px-3 py-2 bg-red-800 text-white rounded hover:bg-red-900 transition-colors text-xs sm:text-sm font-medium"
                              >
                                Send nudge
                              </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-gray-500 whitespace-nowrap">Due date:</label>
                          <input
                            type="date"
                            value={dueEdits[loan.id] ?? loan.due_date.slice(0, 10)}
                            onChange={(e) => setDueEdits((prev) => ({ ...prev, [loan.id]: e.target.value }))}
                            className="flex-1 px-2 py-1.5 text-xs sm:text-sm border border-gray-300 rounded focus:ring-2 focus:ring-amber-600 focus:border-transparent"
                          />
                          <button
                            onClick={() => handleDueSave(loan)}
                            disabled={!dueEdits[loan.id] || dueEdits[loan.id] === loan.due_date.slice(0, 10)}
                            className="px-3 py-1.5 text-xs sm:text-sm bg-white border border-amber-900 text-amber-900 rounded hover:bg-amber-100 font-medium disabled:opacity-40"
                          >
                            Save
                          </button>
                        </div>
                        {loanMsg[loan.id] && (
                          <p className="text-xs text-red-700">{loanMsg[loan.id]}</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {isOwner && (
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
              Borrow Requests ({borrowRequests.length})
            </h2>
            {borrowRequests.length === 0 ? (
              <p className="text-sm sm:text-base text-gray-500 text-center py-6 sm:py-8">No requests yet</p>
            ) : (
              <div className="space-y-2">
                {borrowRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between gap-2 p-3 border border-gray-200 rounded-lg">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm sm:text-base font-medium truncate">
                        {request.book ? (
                          <Link to={`/books/${request.book.id}`} className="hover:text-amber-800 hover:underline">
                            {request.book.title}
                          </Link>
                        ) : (
                          "A book"
                        )}
                      </p>
                      <p className="text-xs text-gray-500">
                        Asked {new Date(request.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {requestStatusChip(request.status)}
                  </div>
                ))}
                {borrowRequests.some((r) => r.status === "pending") && (
                  <p className="text-sm pt-1">
                    <Link to="/requests" className="text-amber-800 underline hover:text-amber-900">
                      Review pending requests →
                    </Link>
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {waitingOn.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Waiting On</h2>
            <p className="text-xs sm:text-sm text-gray-600 mb-3">
              On their want-to-read list, in the library, and currently checked out.
              When a copy comes back, the Lend button on their list below is the quick way to get it to them.
            </p>
            <div className="space-y-2">
              {waitingOn.map((rs) => (
                <div key={rs.id} className="flex items-center justify-between gap-2 p-3 border border-gray-200 rounded-lg">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm sm:text-base font-medium truncate">
                      <Link to={`/books/${rs.book.id}`} className="hover:text-amber-800 hover:underline">
                        {rs.book.title}
                      </Link>
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 truncate">{rs.book.author}</p>
                  </div>
                  <span className="px-2 py-1 rounded text-xs font-semibold bg-amber-100 text-amber-800 flex-shrink-0">
                    Checked out
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Checkout happens where the book is: on its own page, from
            the Lend button on this member's to-be-read list, or by
            approving their request. No checkout panel here. */}
      </div>

      {/* Reading List Section */}
      <div className="mt-4 sm:mt-6">
        <ReadingList
          borrowerId={id}
          borrowerName={borrower.name}
          readingStatuses={readingStatuses}
          allBooks={allBooks}
          onUpdate={fetchBorrowerData}
          isOwner={isOwner}
          onLend={handleLendBook}
          viewerIsSelf={viewerIsSelf}
        />
      </div>
    </div>
  );
}

export default ShowBorrower;
