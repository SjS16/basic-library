// NavBar.jsx
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";

function NavBar() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const isActive = (path) => location.pathname.startsWith(path);
  
  return (
    <nav className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-4 sm:px-6 py-3 sm:py-4">
        <Link to="/books" className="text-xl sm:text-2xl font-bold hover:text-gray-200 transition-colors">
          📚 Library
        </Link>
        
        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-blue-500 transition-colors"
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
        <ul className="hidden md:flex space-x-1">
          <li>
            <Link
              to="/books"
              className={`px-4 py-2 rounded-lg transition-all ${
                isActive("/books")
                  ? "bg-white text-blue-600 font-semibold"
                  : "hover:bg-blue-500"
              }`}
            >
              Books
            </Link>
          </li>
          <li>
            <Link
              to="/borrowers"
              className={`px-4 py-2 rounded-lg transition-all ${
                isActive("/borrowers")
                  ? "bg-white text-purple-600 font-semibold"
                  : "hover:bg-purple-500"
              }`}
            >
              Borrowers
            </Link>
          </li>
        </ul>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-blue-700 border-t border-blue-500">
          <ul className="flex flex-col">
            <li>
              <Link
                to="/books"
                className={`block px-6 py-3 transition-all ${
                  isActive("/books")
                    ? "bg-white text-blue-600 font-semibold"
                    : "hover:bg-blue-600"
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
                    ? "bg-white text-purple-600 font-semibold"
                    : "hover:bg-blue-600"
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
