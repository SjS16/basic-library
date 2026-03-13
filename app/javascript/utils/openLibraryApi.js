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
