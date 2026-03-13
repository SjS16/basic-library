import React from "react";

function BookForm({ book, onChange }) {
  const handleChange = (field, value) => {
    onChange({ ...book, [field]: value });
  };

  return (
    <>
      <FormField label="Author:">
        <input
          type="text"
          value={book.author || ""}
          onChange={(e) => handleChange("author", e.target.value)}
          className="w-full p-2 border rounded mb-4"
        />
      </FormField>

      <FormField label="Published Year:">
        <input
          type="text"
          value={book.published_year || ""}
          onChange={(e) => handleChange("published_year", e.target.value)}
          className="w-full p-2 border rounded mb-4"
        />
      </FormField>

      <FormField label="Description:">
        <textarea
          value={book.description || ""}
          onChange={(e) => handleChange("description", e.target.value)}
          className="w-full p-2 border rounded mb-4"
          rows="4"
        />
      </FormField>

      <FormField label="Genre:">
        <input
          type="text"
          value={book.genre || ""}
          onChange={(e) => handleChange("genre", e.target.value)}
          className="w-full p-2 border rounded mb-4"
        />
      </FormField>

      <FormField label="Rating (1-5):">
        <input
          type="number"
          min="1"
          max="5"
          value={book.rating || ""}
          onChange={(e) => handleChange("rating", e.target.value)}
          className="w-full p-2 border rounded mb-4"
        />
      </FormField>

      <div className="flex items-center mb-4">
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={book.available || false}
            onChange={(e) => handleChange("available", e.target.checked)}
            className="h-4 w-4 mr-2"
          />
          <span className="text-gray-700">Available</span>
        </label>
      </div>

      {book.cover_url && (
        <div className="mb-4">
          <p className="text-gray-700 mb-2">Cover:</p>
          <img
            src={book.cover_url}
            alt="Book cover"
            className="w-40 rounded shadow"
          />
        </div>
      )}
    </>
  );
}

function FormField({ label, children }) {
  return (
    <>
      <label className="block text-gray-700 mb-1">{label}</label>
      {children}
    </>
  );
}

export default BookForm;
