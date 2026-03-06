import React, { useState } from "react";

function Search({ onSearch }) {
  const [query, setQuery] = useState("");
  
  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    onSearch(value);
  };

  return (
    <div className="w-full mb-2">
      <label className="block mb-2 font-semibold">Search by Title, Author, or Genre:</label>
      <input
        type="text"
        placeholder="Search by title, author, or genre..."
        className="w-full p-2 border rounded"
        value={query}
        onChange={handleChange}
      />
    </div>
  );
}

export default Search;