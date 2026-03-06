import React, { useState } from "react";


function BookSort({ onSort }) {
  const [sortBy, setSortBy] = useState("title");

  const handleChange = (e) => {
    setSortBy(e.target.value);
    onSort(e.target.value);
  };

  return (
    <div className="w-full mb-2">
      <label className="block mb-2 font-semibold">Sort by:</label>
      <select value={sortBy} onChange={handleChange} className="w-full p-2 border rounded">
        <option value="title">Title (A-Z)</option>
        <option value="author">Author (A-Z)</option>
        <option value="published_year">Published Year (Newest First)</option>
        <option value="rating">Rating (Highest First)</option>
      </select>
    </div>
  );
}

export default BookSort;