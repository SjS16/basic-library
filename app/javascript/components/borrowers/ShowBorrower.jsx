import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getAuthHeaders } from "../../utils/csrf";
import ReadingList from "./ReadingList";

function ShowBorrower() {
  const [borrower, setBorrower] = useState(null);
  const [currentLoans, setCurrentLoans] = useState([]);
  const [readingStatuses, setReadingStatuses] = useState([]);
  const [availableBooks, setAvailableBooks] = useState([]);
  const [allBooks, setAllBooks] = useState([]);
  const [selectedBookId, setSelectedBookId] = useState("");
  const navigate = useNavigate();
  const { id } = useParams();

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

  useEffect(() => {
    fetchBorrowerData();

    // Fetch all books for reading list
    fetch("/books.json")
      .then((res) => res.json())
      .then((data) => {
        setAllBooks(data);
        setAvailableBooks(data.filter((book) => book.available));
      })
      .catch((err) => console.error("Error fetching books:", err));
  }, [id]);

  const handleCheckout = () => {
    if (!selectedBookId) return;

    fetch(`/borrowers/${id}/checkout_book.json`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ book_id: selectedBookId }),
    })
      .then((res) => res.json())
      .then(() => {
        // Refresh data
        window.location.reload();
      })
      .catch((err) => console.error("Error checking out book:", err));
  };

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

  const canCheckout = borrower.standing >= 50 && currentLoans.length < 5;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <button
          onClick={() => navigate("/borrowers")}
          className="text-sm sm:text-base text-blue-600 hover:text-blue-800 mb-3 sm:mb-4 inline-flex items-center gap-2"
        >
          ← Back to Borrowers
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

            <button
              onClick={() => navigate(`/borrowers/${id}/edit`)}
              className="px-3 sm:px-4 py-2 text-sm sm:text-base text-gray-700 hover:bg-gray-100 rounded-lg transition-colors self-start sm:self-auto"
            >
              Edit
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
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
                        <h3 className="text-sm sm:text-base font-bold text-gray-900 truncate">{loan.book.title}</h3>
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
                    <button
                      onClick={() => handleReturn(loan.book.id)}
                      className="w-full px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-xs sm:text-sm font-medium"
                    >
                      Return Book
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Checkout New Book */}
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Checkout Book</h2>

          {!canCheckout ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-yellow-800 font-medium">
                {borrower.standing < 50
                  ? "Standing too low (minimum 50 required)"
                  : "Maximum books checked out (5/5)"}
              </p>
            </div>
          ) : availableBooks.length === 0 ? (
            <p className="text-sm sm:text-base text-gray-500 text-center py-6 sm:py-8">No books available</p>
          ) : (
            <>
              <select
                value={selectedBookId}
                onChange={(e) => setSelectedBookId(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg mb-3 sm:mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a book...</option>
                {availableBooks.map((book) => (
                  <option key={book.id} value={book.id}>
                    {book.title} - {book.author}
                  </option>
                ))}
              </select>

              <button
                onClick={handleCheckout}
                disabled={!selectedBookId}
                className="w-full px-4 py-2 sm:py-3 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Checkout Selected Book
              </button>

              <p className="text-xs sm:text-sm text-gray-500 mt-2 sm:mt-3">
                Default due date: 2 weeks from checkout
              </p>
            </>
          )}
        </div>
      </div>

      {/* Reading List Section */}
      <div className="mt-4 sm:mt-6">
        <ReadingList
          borrowerId={id}
          readingStatuses={readingStatuses}
          allBooks={allBooks}
          onUpdate={fetchBorrowerData}
        />
      </div>
    </div>
  );
}

export default ShowBorrower;
