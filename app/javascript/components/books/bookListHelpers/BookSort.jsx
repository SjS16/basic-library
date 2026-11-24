import React from "react";

function BookSort({ onSort, value }) {
  return (
    <select
      value={value}
      onChange={(e) => onSort(e.target.value)}
      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
    >
      <option value="title">Title (A-Z)</option>
      <option value="author">Author (A-Z)</option>
      <option value="published_year">Year (Newest First)</option>
      <option value="rating">Rating (Highest First)</option>
      <option value="recently_added">Recently Added</option>
    </select>
  );
}

export default BookSort;
