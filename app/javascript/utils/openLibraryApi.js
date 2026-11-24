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

  const isbn = (result.isbn || []).find((i) => i.length === 13) || (result.isbn || [])[0] || "";

  return {
    title: result.title,
    author: result.author_name?.join(", ") || "",
    published_year: result.first_publish_year || "",
    description: description || "",
    cover_url: coverUrl,
    genre: result.subject?.[0] || "",
    isbn,
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
      isbn: cleanISBN,
    };
  } catch (error) {
    console.error("ISBN lookup error:", error);
    throw error;
  }
}

// One-shot lookup by title (and author, when known): returns the
// same details shape as fetchBookDetails for the best match, or
// null when Open Library has nothing. Falls back to a title-only
// search when the author string doesn't match their records.
export async function fetchBookByTitleAuthor(title, author) {
  const search = async (withAuthor) => {
    const params = new URLSearchParams({ title, limit: "1" });
    if (withAuthor && author) params.set("author", author);
    const res = await fetch(`https://openlibrary.org/search.json?${params}`);
    const data = await res.json();
    return data.docs?.[0] || null;
  };

  const doc = (await search(true)) || (author ? await search(false) : null);
  if (!doc) return null;
  return fetchBookDetails(doc);
}

// The fields Open Library is allowed to fill in, with the label
// used when telling the user what was added. Enrichment only ever
// fills blanks; it never overwrites what's already on the book.
export const ENRICHABLE_FIELDS = [
  ["cover_url", "a cover image"],
  ["description", "a description"],
  ["published_year", "the published year"],
  ["genre", "a genre"],
  ["isbn", "an ISBN"],
];

export function enrichableFields(suggestion, current) {
  return ENRICHABLE_FIELDS.filter(([field]) => suggestion?.[field] && !current?.[field]);
}

// Finds what Open Library can add to a book: tries the ISBN first
// (the exact edition), then a title/author search, and returns the
// details with the most to offer, or null when there's nothing new.
export async function findEnrichment(book) {
  let details = null;
  if (book.isbn) {
    details = await fetchBookByISBN(book.isbn).catch(() => null);
  }
  if (!details || enrichableFields(details, book).length === 0) {
    const bySearch = await fetchBookByTitleAuthor(book.title, book.author).catch(() => null);
    if (bySearch && enrichableFields(bySearch, book).length > 0) details = bySearch;
  }
  return details && enrichableFields(details, book).length > 0 ? details : null;
}

// Collects the different covers Open Library has for a book: the
// covers on its work record first (other editions and languages
// live there), then the cover of each top search match. Returns
// full-size cover URLs, best matches first.
export async function fetchCoverOptions(title, author) {
  if (!title) return [];
  const params = new URLSearchParams({ title, limit: "10", fields: "key,cover_i" });
  if (author) params.set("author", author);
  const response = await fetch(`https://openlibrary.org/search.json?${params}`);
  if (!response.ok) return [];
  const data = await response.json();
  const docs = data.docs || [];

  const ids = [];
  const addId = (coverId) => {
    if (coverId && !ids.includes(coverId)) ids.push(coverId);
  };

  const firstKey = docs[0]?.key;
  if (firstKey) {
    try {
      const workResponse = await fetch(`https://openlibrary.org${firstKey}.json`);
      if (workResponse.ok) {
        const work = await workResponse.json();
        (work.covers || []).forEach(addId);
      }
    } catch (err) {
      // The search covers alone are enough; carry on.
    }
  }
  docs.forEach((doc) => addId(doc.cover_i));

  return ids.slice(0, 12).map((coverId) => `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`);
}
