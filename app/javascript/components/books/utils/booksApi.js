import { getAuthHeaders } from "./csrf";

export const fetchBooks = async () => {
  try {
    const res = await fetch("/books.json");
    return await res.json();
  } catch (err) {
    console.error("Error fetching books:", err);
    return [];
  }
};

export const updateBook = async (bookId, updatedBook) => {
  try {
    const res = await fetch(`/books/${bookId}.json`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(updatedBook),
    });
    return await res.json();
  } catch (err) {
    console.error("Error updating book:", err);
  }
};