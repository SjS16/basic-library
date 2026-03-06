import React from "react";

function BookActions({ book, onUpdate, onDelete, onNavigate }) {
  return (
    <div className="flex items-center">
      {book.available ? (
        <button
          className="ml-4 text-sm text-green-500 hover:text-green-700"
          onClick={() => onUpdate("available", false)}
        >
          Check Out
        </button>
      ) : (
        <button
          className="ml-4 text-sm text-red-500 hover:text-red-700"
          onClick={() => onUpdate("available", true)}
        >
          Return
        </button>
      )}
      <button
        className="ml-4 text-sm text-gray-500 hover:text-gray-700"
        onClick={onNavigate}
      >
        Edit
      </button>
      <button
        className="ml-2 text-sm text-red-500 hover:text-red-700"
        onClick={onDelete}
      >
        Delete
      </button>
    </div>
  );
}

export default BookActions;