export async function fetchBookDetails(result) {
  const coverUrl = result.cover_i
    ? `https://covers.openlibrary.org/b/id/${result.cover_i}-L.jpg`
    : null;

  let description = "";

  try {
    const res = await fetch(`https://openlibrary.org${result.key}.json`);
    const data = await res.json();

    description =
      typeof data.description === "string"
        ? data.description
        : data.description?.value;
  } catch (err) {
    console.error("Description fetch error:", err);
  }

  return {
    title: result.title,
    author: result.author_name?.join(", ") || "",
    published_year: result.first_publish_year || "",
    description: description || "",
    cover_url: coverUrl,
    genre: result.subject?.[0] || "",
  };
}

export async function fetchBookByISBN(isbn) {
  try {
    // Clean ISBN (remove dashes and spaces)
    const cleanISBN = isbn.replace(/[-\s]/g, "");
    
    // Try Open Library ISBN API
    const response = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${cleanISBN}&format=json&jscmd=data`);
    const data = await response.json();
    
    const bookKey = `ISBN:${cleanISBN}`;
    const bookData = data[bookKey];
    
    if (!bookData) {
      throw new Error("Book not found");
    }

    // Extract cover URL
    let coverUrl = null;
    if (bookData.cover) {
      coverUrl = bookData.cover.large || bookData.cover.medium || bookData.cover.small;
    }

    // Extract description
    let description = "";
    if (bookData.excerpts && bookData.excerpts.length > 0) {
      description = bookData.excerpts[0].text;
    }

    // Extract authors
    const authors = bookData.authors?.map(a => a.name).join(", ") || "";

    // Extract genre/subjects
    const genre = bookData.subjects?.map(s => s.name).slice(0, 3).join(", ") || "";

    return {
      title: bookData.title || "",
      author: authors,
      published_year: bookData.publish_date ? new Date(bookData.publish_date).getFullYear() : "",
      description: description,
      cover_url: coverUrl,
      genre: genre,
    };
  } catch (error) {
    console.error("ISBN lookup error:", error);
    throw error;
  }
}
