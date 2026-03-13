import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

function BorrowersList() {
  const [borrowers, setBorrowers] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetch("/borrowers.json")
      .then((res) => res.json())
      .then((data) => setBorrowers(data))
      .catch((err) => console.error("Error fetching borrowers:", err));
  }, [location.key]);

  const getStandingColor = (standing) => {
    if (standing >= 90) return "green";
    if (standing >= 70) return "blue";
    if (standing >= 50) return "yellow";
    if (standing >= 30) return "orange";
    return "red";
  };

  const getStandingBadge = (standing) => {
    const color = getStandingColor(standing);
    const colorClasses = {
      green: "bg-green-100 text-green-800",
      blue: "bg-blue-100 text-blue-800",
      yellow: "bg-yellow-100 text-yellow-800",
      orange: "bg-orange-100 text-orange-800",
      red: "bg-red-100 text-red-800",
    };

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${colorClasses[color]}`}>
        {standing}/100
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Borrowers</h1>
            <p className="text-gray-600">Manage library members and their loan status</p>
          </div>
          <button
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
            onClick={() => navigate("/borrowers/new")}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Borrower
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-5 border-l-4 border-blue-500">
            <p className="text-sm text-gray-600 mb-1">Total Borrowers</p>
            <p className="text-3xl font-bold text-gray-900">{borrowers.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-5 border-l-4 border-green-500">
            <p className="text-sm text-gray-600 mb-1">Excellent Standing</p>
            <p className="text-3xl font-bold text-green-600">
              {borrowers.filter((b) => b.standing >= 90).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-5 border-l-4 border-yellow-500">
            <p className="text-sm text-gray-600 mb-1">Fair Standing</p>
            <p className="text-3xl font-bold text-yellow-600">
              {borrowers.filter((b) => b.standing >= 50 && b.standing < 70).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-5 border-l-4 border-red-500">
            <p className="text-sm text-gray-600 mb-1">Restricted</p>
            <p className="text-3xl font-bold text-red-600">
              {borrowers.filter((b) => b.standing < 50).length}
            </p>
          </div>
        </div>
      </div>

      {/* Borrowers List */}
      {borrowers.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <svg className="w-24 h-24 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No borrowers yet</h3>
          <p className="text-gray-600 mb-4">Add your first library member to get started</p>
          <button
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            onClick={() => navigate("/borrowers/new")}
          >
            Add First Borrower
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {borrowers.map((borrower) => (
            <div
              key={borrower.id}
              className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-200 overflow-hidden border border-gray-100"
            >
              <div className="flex items-center justify-between p-6">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                    {borrower.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <Link
                      to={`/borrowers/${borrower.id}`}
                      className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors"
                    >
                      {borrower.name}
                    </Link>
                    {borrower.email && (
                      <p className="text-sm text-gray-600 mt-1">{borrower.email}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm text-gray-600 mb-1">Standing</p>
                    {getStandingBadge(borrower.standing)}
                  </div>
                  
                  <Link
                    to={`/borrowers/${borrower.id}`}
                    className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium"
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default BorrowersList;
