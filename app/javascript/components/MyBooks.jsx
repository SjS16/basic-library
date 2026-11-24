import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useCurrentUser } from "../hooks/useCurrentUser";
import ReadingList from "./borrowers/ReadingList";
import RecommendedInbox from "./recommendations/RecommendedInbox";
import RecommendBookForm from "./recommendations/RecommendBookForm";
import SentRecommendations from "./recommendations/SentRecommendations";

// A member's personal page: what they have checked out, then their
// reading lists. Shelves in the order a member thinks about them.
function MyBooks() {
  const currentUser = useCurrentUser();
  const borrowerId = currentUser?.borrower_id;
  const [borrower, setBorrower] = useState(null);
  const [currentLoans, setCurrentLoans] = useState([]);
  const [readingStatuses, setReadingStatuses] = useState([]);
  const [allBooks, setAllBooks] = useState([]);

  const fetchData = useCallback(() => {
    if (!borrowerId) return;
    fetch(`/borrowers/${borrowerId}.json`)
      .then((res) => res.json())
      .then((data) => {
        setBorrower(data);
        setCurrentLoans(data.current_loans || []);
        setReadingStatuses(data.reading_statuses || []);
      })
      .catch((err) => console.error("Error fetching your books:", err));
  }, [borrowerId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetch("/books.json")
      .then((res) => res.json())
      .then((data) => setAllBooks(data))
      .catch(() => {});
  }, []);

  if (!borrowerId || !borrower) {
    return <div className="text-center p-12">Loading...</div>;
  }

  const dueLabel = (dueDate) => {
    const days = Math.ceil((new Date(dueDate) - Date.now()) / 86400000);
    if (days < 0) return `${Math.abs(days)}d overdue`;
    if (days === 0) return "Due today";
    if (days === 1) return "Due tomorrow";
    return `Due in ${days}d`;
  };

  const sortedLoans = [...currentLoans].sort(
    (a, b) => new Date(a.due_date) - new Date(b.due_date)
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-amber-950">My Books</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          What you have, what you want, and what you've read.
        </p>
      </div>

      {/* Checked Out shelf */}
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
          Checked Out ({currentLoans.length})
        </h2>
        {currentLoans.length === 0 ? (
          <p className="text-sm sm:text-base text-gray-500 text-center py-6 sm:py-8">
            Nothing checked out right now. Your next book is waiting in the collection.
          </p>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {sortedLoans.map((loan) => {
              const overdue = new Date(loan.due_date) < new Date();
              return (
                <div
                  key={loan.id}
                  className={`p-3 sm:p-4 rounded-lg border-2 ${
                    overdue ? "border-red-300 bg-red-50" : "border-gray-200"
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm sm:text-base font-bold text-gray-900 truncate">
                        <Link to={`/books/${loan.book.id}`} className="hover:text-amber-800 hover:underline">
                          {loan.book.title}
                        </Link>
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 truncate">{loan.book.author}</p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded font-semibold flex-shrink-0 ${
                        overdue ? "bg-red-600 text-white" : "bg-amber-100 text-amber-900"
                      }`}
                    >
                      {dueLabel(loan.due_date)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Due: {new Date(loan.due_date).toLocaleDateString()}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recommendations waiting on a decision. */}
      <RecommendedInbox onAccepted={fetchData} />

      {/* The reading lists: want to read, currently reading, read. */}
      <ReadingList
        borrowerId={borrowerId}
        borrowerName={borrower.name}
        readingStatuses={readingStatuses}
        allBooks={allBooks}
        onUpdate={fetchData}
        isOwner={false}
        onLend={null}
        viewerIsSelf={true}
      />

      {/* Recommend a book to another member. */}
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mt-4 sm:mt-6">
        <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">Recommend a Book</h2>
        <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
          Think someone here would love a book? It can be any book Open Library knows, not
          just one on these shelves. They decide whether it joins their list.
        </p>
        <RecommendBookForm />
      </div>

      {/* What you have recommended, and what came of it. */}
      <SentRecommendations />
    </div>
  );
}

export default MyBooks;
