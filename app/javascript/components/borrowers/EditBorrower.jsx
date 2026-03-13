import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getAuthHeaders } from "../../utils/csrf";

function EditBorrower() {
  const [borrower, setBorrower] = useState({ name: "", email: "", standing: 100 });
  const navigate = useNavigate();
  const { id } = useParams();

  const pageHeading = id ? "Edit Borrower" : "Add New Borrower";

  useEffect(() => {
    if (id) {
      fetch(`/borrowers/${id}.json`)
        .then((res) => res.json())
        .then((data) => setBorrower(data))
        .catch((err) => console.error("Error fetching borrower:", err));
    }
  }, [id]);

  const saveBorrower = () => {
    const method = borrower.id ? "PUT" : "POST";
    const url = borrower.id ? `/borrowers/${borrower.id}.json` : "/borrowers.json";

    fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify({ borrower }),
    })
      .then((res) => res.json())
      .then(() => {
        alert(`Borrower ${borrower.id ? "updated" : "created"} successfully!`);
        navigate("/borrowers");
      })
      .catch((err) => console.error("Error saving borrower:", err));
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6">
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 lg:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">{pageHeading}</h1>

        <div className="space-y-4 sm:space-y-6">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Name *
            </label>
            <input
              type="text"
              value={borrower.name || ""}
              onChange={(e) => setBorrower({ ...borrower, name: e.target.value })}
              className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter borrower's name"
              required
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={borrower.email || ""}
              onChange={(e) => setBorrower({ ...borrower, email: e.target.value })}
              className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter email address (optional)"
            />
          </div>

          {id && (
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Standing: {borrower.standing}/100
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={borrower.standing || 100}
                onChange={(e) =>
                  setBorrower({ ...borrower, standing: parseInt(e.target.value) })
                }
                className="w-full"
              />
              <p className="text-xs sm:text-sm text-gray-500 mt-2">
                Note: Standing is usually calculated automatically based on loan history
              </p>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
            <h3 className="text-sm sm:text-base font-semibold text-blue-900 mb-2">Borrower Guidelines</h3>
            <ul className="text-xs sm:text-sm text-blue-800 space-y-1">
              <li>• Maximum 5 books at a time</li>
              <li>• Default loan period: 2 weeks</li>
              <li>• Standing must be 50+ to checkout books</li>
              <li>• Late returns decrease standing</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 mt-6 sm:mt-8">
          <button
            className="w-full sm:w-auto px-4 sm:px-6 py-2 text-sm sm:text-base bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            onClick={() => navigate("/borrowers")}
          >
            Cancel
          </button>
          <button
            className="w-full sm:w-auto px-4 sm:px-6 py-2 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            onClick={saveBorrower}
            disabled={!borrower.name}
          >
            {id ? "Update" : "Create"} Borrower
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditBorrower;
