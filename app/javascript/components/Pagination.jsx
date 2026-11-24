import React from "react";

// Numbered page controls for long lists. Renders nothing when
// everything fits on one page. Long lists are windowed: the first
// and last page always show, plus the current page and its
// neighbours, with ellipses in the gaps.
function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const wanted = [1, totalPages, currentPage - 1, currentPage, currentPage + 1]
    .filter((p) => p >= 1 && p <= totalPages);
  const numbers = [...new Set(wanted)].sort((a, b) => a - b);
  const items = [];
  numbers.forEach((p, i) => {
    if (i > 0 && p - numbers[i - 1] > 1) items.push("gap");
    items.push(p);
  });

  const base = "px-3 py-1.5 rounded-lg text-sm transition-colors";
  const idle = `${base} bg-white border border-gray-300 text-gray-700 font-medium hover:bg-amber-50 disabled:opacity-40 disabled:hover:bg-white`;
  const active = `${base} bg-amber-900 text-amber-50 font-semibold`;

  return (
    <nav className="flex items-center justify-center gap-1.5 mt-4 flex-wrap" aria-label="Pagination">
      <button type="button" className={idle} disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)}>
        ← Prev
      </button>
      {items.map((item, i) =>
        item === "gap" ? (
          <span key={`gap-${i}`} className="px-1 text-gray-400">…</span>
        ) : (
          <button
            key={item}
            type="button"
            className={item === currentPage ? active : idle}
            aria-current={item === currentPage ? "page" : undefined}
            onClick={() => onPageChange(item)}
          >
            {item}
          </button>
        )
      )}
      <button type="button" className={idle} disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)}>
        Next →
      </button>
    </nav>
  );
}

export default Pagination;
