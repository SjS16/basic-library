import React, { useState } from "react";

function BookFilter({ onFilter }) {
  const [status, setStatus] = useState("all");

  const handleChange = (e) => {
    const newStatus = e.target.value;
    setStatus(newStatus);
    onFilter(newStatus);
  };

  return (
    <div className="w-full mb-2">
      <label className="block mb-2 font-semibold">Filter by Availability:</label>
      <select
        value={status}
        onChange={handleChange}
        className="w-full p-2 border rounded"
      >
        <option value="all">All Books</option>
        <option value="available">Available Only</option>
        <option value="checked_out">Checked Out Only</option>
      </select>
    </div>
  );
}

export default BookFilter;