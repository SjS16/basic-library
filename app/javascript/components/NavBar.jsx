// NavBar.jsx
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";

function NavBar() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
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
              className="px-4 py-2 transition-all hover:bg-amber-800 border-l border-amber-700"
            >
              Home
            </a>
          </li>
          <li>
            <Link
              to="/books"
              className={`px-4 py-2 transition-all border-l border-amber-700 ${
                isActive("/books")
                  ? "bg-amber-100 text-amber-950 font-semibold"
                  : "hover:bg-amber-800"
              }`}
            >
              Books
            </Link>
          </li>
          <li>
            <Link
              to="/borrowers"
              className={`px-4 py-2 transition-all border-x border-amber-700 ${
                isActive("/borrowers")
                  ? "bg-amber-100 text-amber-950 font-semibold"
                  : "hover:bg-amber-800"
              }`}
            >
              Members
            </Link>
          </li>
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
          </ul>
        </div>
      )}
    </nav>
  );
}

export default NavBar;
