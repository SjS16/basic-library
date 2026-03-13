import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

function Home() {
  const [stats, setStats] = useState({
    totalBooks: 0,
    availableBooks: 0,
    totalBorrowers: 0,
    activeLoans: 0
  });
  const [recentBooks, setRecentBooks] = useState([]);

  useEffect(() => {
    // Fetch home page data
    fetch('/books.json')
      .then(response => response.json())
      .then(books => {
        setStats(prev => ({
          ...prev,
          totalBooks: books.length,
          availableBooks: books.filter(b => b.available).length
        }));
        setRecentBooks(books.slice(0, 6));
      });

    fetch('/borrowers.json')
      .then(response => response.json())
      .then(borrowers => {
        setStats(prev => ({ ...prev, totalBorrowers: borrowers.length }));
      });

    fetch('/loans.json')
      .then(response => response.json())
      .then(loans => {
        const active = loans.filter(l => !l.returned_at).length;
        setStats(prev => ({ ...prev, activeLoans: active }));
      });
  }, []);

  return (
    <div className="min-h-screen -mx-4 sm:-mx-6 -mt-8 sm:-mt-12">
      {/* Hero Section */}
      <div className="relative overflow-hidden border-b-4 border-amber-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-serif font-bold text-amber-950 mb-6 tracking-tight" style={{textShadow: "2px 2px 4px rgba(0,0,0,0.1)"}}>
              My Library
            </h1>
            <p className="text-xl sm:text-2xl text-amber-900 mb-8 max-w-3xl mx-auto font-serif italic">
              A timeless collection of knowledge and stories, carefully curated and preserved.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/books" className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-amber-50 bg-amber-900 hover:bg-amber-800 border-2 border-amber-950 shadow-lg transition-all">
                Browse Collection
              </Link>
              <Link to="/borrowers" className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 border-2 border-amber-900 shadow-lg transition-all">
                View Members
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-amber-100 border-2 border-amber-900 shadow-lg p-6 transition-all hover:shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-serif font-semibold text-amber-800 uppercase tracking-wide">Total Volumes</p>
                <p className="text-4xl font-serif font-bold text-amber-950 mt-2">{stats.totalBooks}</p>
              </div>
              <div className="text-5xl opacity-50">📖</div>
            </div>
          </div>

          <div className="bg-amber-100 border-2 border-amber-800 shadow-lg p-6 transition-all hover:shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-serif font-semibold text-amber-800 uppercase tracking-wide">On Shelves</p>
                <p className="text-4xl font-serif font-bold text-amber-900 mt-2">{stats.availableBooks}</p>
              </div>
              <div className="text-5xl opacity-50">✓</div>
            </div>
          </div>

          <div className="bg-amber-50 border-2 border-amber-700 shadow-lg p-6 transition-all hover:shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-serif font-semibold text-amber-800 uppercase tracking-wide">Members</p>
                <p className="text-4xl font-serif font-bold text-amber-950 mt-2">{stats.totalBorrowers}</p>
              </div>
              <div className="text-5xl opacity-50">👥</div>
            </div>
          </div>

          <div className="bg-red-50 border-2 border-red-900 shadow-lg p-6 transition-all hover:shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-serif font-semibold text-red-900 uppercase tracking-wide">Checked Out</p>
                <p className="text-4xl font-serif font-bold text-red-950 mt-2">{stats.activeLoans}</p>
              </div>
              <div className="text-5xl opacity-50">📚</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Books Section */}
      {recentBooks.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-amber-950 mb-3 border-b-2 border-amber-900 inline-block pb-2">Recent Acquisitions</h2>
            <p className="text-lg text-amber-900 font-serif italic mt-4">Newly catalogued volumes for your perusal</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {recentBooks.map(book => (
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
      )}

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t-4 border-amber-900">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center bg-amber-100 border-2 border-amber-900 p-8 shadow-md">
            <div className="text-6xl mb-4 opacity-50">📱</div>
            <h3 className="text-xl font-serif font-bold text-amber-950 mb-2">Modern Cataloguing</h3>
            <p className="text-amber-900 font-serif">Swift book entry via ISBN barcode scanning technology</p>
          </div>
          <div className="text-center bg-amber-100 border-2 border-amber-900 p-8 shadow-md">
            <div className="text-6xl mb-4 opacity-50">📊</div>
            <h3 className="text-xl font-serif font-bold text-amber-950 mb-2">Circulation Records</h3>
            <p className="text-amber-900 font-serif">Meticulous tracking of loans, returns, and member standing</p>
          </div>
          <div className="text-center bg-amber-100 border-2 border-amber-900 p-8 shadow-md">
            <div className="text-6xl mb-4 opacity-50">📝</div>
            <h3 className="text-xl font-serif font-bold text-amber-950 mb-2">Personal Collections</h3>
            <p className="text-amber-900 font-serif">Curate reading lists and mark your most treasured volumes</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
