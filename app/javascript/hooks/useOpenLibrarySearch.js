import { useState, useEffect } from "react";

export function useOpenLibrarySearch(searchTerm) {
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchTerm.length >= 3) {
        searchOpenLibrary(searchTerm);
      } else {
        setSearchResults([]);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const searchOpenLibrary = async (title) => {
    setIsSearching(true);
    try {
      const res = await fetch(
        `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}`
      );
      const data = await res.json();
      setSearchResults(data.docs.slice(0, 5));
    } catch (err) {
      console.error("Search error:", err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const clearResults = () => setSearchResults([]);

  return { searchResults, isSearching, clearResults };
}
