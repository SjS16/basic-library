// NavBar.jsx
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useCurrentUser, useCurrentUserLoaded } from "../hooks/useCurrentUser";
import { getAuthHeaders } from "../utils/csrf";

function NavBar() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const currentUser = useCurrentUser();
  const isOwner = !!currentUser?.owner;
  const myBorrowerId = currentUser?.borrower_id;
  const meLoaded = useCurrentUserLoaded();
  const [pendingCount, setPendingCount] = useState(0);

  // The owner's notification: how many requests (to borrow a book,
  // or to join the library) are waiting.
  useEffect(() => {
    if (!isOwner) return;
    Promise.all([
      fetch("/borrow_requests.json")
        .then((res) => (res.ok ? res.json() : { borrow_requests: [] }))
        .catch(() => ({ borrow_requests: [] })),
      fetch("/membership_requests.json")
        .then((res) => (res.ok ? res.json() : { membership_requests: [] }))
        .catch(() => ({ membership_requests: [] })),
    ]).then(([borrowData, joinData]) => {
      const borrowCount = (borrowData.borrow_requests || []).filter((r) => r.status === "pending").length;
      const joinCount = (joinData.membership_requests || []).filter((r) => r.status === "pending").length;
      setPendingCount(borrowCount + joinCount);
    });
  }, [isOwner, location.pathname]);

  const handleSignOut = async () => {
    try {
      await fetch("/session", { method: "DELETE", headers: getAuthHeaders() });
    } catch (err) {
      // Even if the request fails, the sign-in page is the right place to land.
    }
    window.location.href = "/session/new";
  };
  
  const isActive = (path) => location.pathname.startsWith(path);
  
  return (
    <nav className="bg-amber-900 text-amber-50 shadow-2xl fixed w-full top-0 z-50 border-b-4 border-amber-950">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-4 sm:px-6 py-3 sm:py-4">
        <a href="/" className="text-xl sm:text-2xl font-serif font-bold hover:text-amber-200 transition-colors">
          📚 My Library
        </a>
        
        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 hover:bg-amber-800 transition-colors border border-amber-700"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        {/* Desktop Menu */}
        <ul className="hidden md:flex space-x-1 font-serif">
          <li>
            <a
              href="/"
              className="px-4 py-2 inline-block transition-all hover:bg-amber-800 border-l border-amber-700"
            >
              Home
            </a>
          </li>
          <li>
            <Link
              to="/books"
              className={`px-4 py-2 inline-block transition-all border-l border-amber-700 ${
                isActive("/books")
                  ? "bg-amber-100 text-amber-950 font-semibold"
                  : "hover:bg-amber-800"
              }`}
            >
              Books
            </Link>
          </li>
          {isOwner && (
            <li>
              <Link
                to="/borrowers"
                className={`px-4 py-2 inline-block transition-all border-l border-amber-700 ${
                  isActive("/borrowers")
                    ? "bg-amber-100 text-amber-950 font-semibold"
                    : "hover:bg-amber-800"
                }`}
              >
                Members
              </Link>
            </li>
          )}
          {myBorrowerId && (
            <li>
              <Link
                to="/my-books"
                className={`px-4 py-2 inline-block transition-all border-l border-amber-700 ${
                  isActive("/my-books")
                    ? "bg-amber-100 text-amber-950 font-semibold"
                    : "hover:bg-amber-800"
                }`}
              >
                My Books
              </Link>
            </li>
          )}
          {currentUser && (
            <li>
              <Link
                to="/requests"
                className={`px-4 py-2 inline-block transition-all border-l border-amber-700 ${
                  isActive("/requests")
                    ? "bg-amber-100 text-amber-950 font-semibold"
                    : "hover:bg-amber-800"
                }`}
              >
                Requests
                {isOwner && pendingCount > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 bg-red-600 text-white text-xs font-bold rounded-full">
                    {pendingCount}
                  </span>
                )}
              </Link>
            </li>
          )}
          {meLoaded && currentUser && (
            <>
              <li>
                <a href="/profile" className="px-4 py-2 inline-block transition-all hover:bg-amber-800 border-l border-amber-700">
                  Profile
                </a>
              </li>
              <li>
                <button onClick={handleSignOut} className="px-4 py-2 transition-all hover:bg-amber-800 border-x border-amber-700 cursor-pointer">
                  Sign out
                </button>
              </li>
            </>
          )}
          {meLoaded && !currentUser && (
            <>
              <li>
                <a href="/session/new" className="px-4 py-2 inline-block transition-all hover:bg-amber-800 border-l border-amber-700">
                  Sign in
                </a>
              </li>
              <li>
                <a href="/registration/new" className="px-4 py-2 inline-block transition-all hover:bg-amber-800 border-x border-amber-700">
                  Sign up
                </a>
              </li>
            </>
          )}
        </ul>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-amber-800 border-t-2 border-amber-950">
          <ul className="flex flex-col font-serif">
            <li>
              <a
                href="/"
                className="block px-6 py-3 transition-all hover:bg-amber-700 border-b border-amber-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                🏠 Home
              </a>
            </li>
            <li>
              <Link
                to="/books"
                className={`block px-6 py-3 transition-all border-b border-amber-700 ${
                  isActive("/books")
                    ? "bg-amber-100 text-amber-950 font-semibold"
                    : "hover:bg-amber-700"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                📚 Books
              </Link>
            </li>
            {isOwner && (
              <li>
                <Link
                  to="/borrowers"
                  className={`block px-6 py-3 transition-all ${
                    isActive("/borrowers")
                      ? "bg-amber-100 text-amber-950 font-semibold"
                      : "hover:bg-amber-700"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  👥 Borrowers
                </Link>
              </li>
            )}
            {myBorrowerId && (
              <li>
                <Link
                  to="/my-books"
                  className={`block px-6 py-3 transition-all ${
                    isActive("/my-books")
                      ? "bg-amber-100 text-amber-950 font-semibold"
                      : "hover:bg-amber-700"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  📖 My Books
                </Link>
              </li>
            )}
            {currentUser && (
              <li>
                <Link
                  to="/requests"
                  className={`block px-6 py-3 transition-all border-b border-amber-700 ${
                    isActive("/requests")
                      ? "bg-amber-100 text-amber-950 font-semibold"
                      : "hover:bg-amber-700"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  📬 Requests
                  {isOwner && pendingCount > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 bg-red-600 text-white text-xs font-bold rounded-full">
                      {pendingCount}
                    </span>
                  )}
                </Link>
              </li>
            )}
            {meLoaded && currentUser && (
              <>
                <li>
                  <a href="/profile" className="block px-6 py-3 transition-all hover:bg-amber-700 border-b border-amber-700">
                    👤 Profile &amp; Settings
                  </a>
                </li>
                <li>
                  <button onClick={handleSignOut} className="block w-full text-left px-6 py-3 transition-all hover:bg-amber-700 cursor-pointer">
                    🚪 Sign out
                  </button>
                </li>
              </>
            )}
            {meLoaded && !currentUser && (
              <>
                <li>
                  <a href="/session/new" className="block px-6 py-3 transition-all hover:bg-amber-700 border-b border-amber-700">
                    🔑 Sign in
                  </a>
                </li>
                <li>
                  <a href="/registration/new" className="block px-6 py-3 transition-all hover:bg-amber-700">
                    📝 Sign up
                  </a>
                </li>
              </>
            )}
          </ul>
        </div>
      )}
    </nav>
  );
}

export default NavBar;
