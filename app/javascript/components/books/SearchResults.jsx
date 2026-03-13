import React from "react";

function SearchResults({ results, onSelect, onDismiss }) {
  if (results.length === 0) return null;

  return (
    <div className="border rounded bg-white shadow mb-4 relative">
      <div className="p-2 bg-gray-50 border-b flex justify-between items-center">
        <span className="text-sm text-gray-600">Select from Open Library or continue typing</span>
        <button
          onClick={onDismiss}
          className="text-gray-500 hover:text-gray-700 font-bold"
          title="Close search results"
        >
          ✕
        </button>
      </div>
      {results.map((result, index) => (
        <div
          key={index}
          className="p-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
          onClick={() => onSelect(result)}
        >
          <strong>{result.title}</strong>
          {result.author_name && ` — ${result.author_name[0]}`}
          {result.first_publish_year && (
            <span className="text-gray-500 text-sm ml-2">
              ({result.first_publish_year})
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

export default SearchResults;
