import React from "react";

function BookFilter({ onFilter, value }) {
  return (
    <select
      value={value}
      onChange={(e) => onFilter(e.target.value)}
      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
    >
      <option value="all">All Books</option>
      <option value="available">Available Only</option>
      <option value="unavailable">Checked Out Only</option>
    </select>
  );
}

export default BookFilter;
