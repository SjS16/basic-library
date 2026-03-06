# db/seeds.rb

# Remove all existing books (optional, useful in development)
Book.destroy_all

# Create some sample books
Book.create!([
  {
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    genre: "Fantasy",
    published_year: 1937,
    description: "A hobbit named Bilbo goes on an unexpected adventure.",
    available: true
  },
  {
    title: "1984",
    author: "George Orwell",
    genre: "Dystopian",
    published_year: 1949,
    description: "A chilling vision of a totalitarian future.",
    available: true
  },
  {
    title: "Pride and Prejudice",
    author: "Jane Austen",
    genre: "Romance",
    published_year: 1813,
    description: "Elizabeth Bennet navigates love and social expectations.",
    available: false
  },
  {
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    genre: "Classic",
    published_year: 1925,
    description: "The mysterious Jay Gatsby and his obsession with Daisy Buchanan.",
    available: true
  },
  {
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    genre: "Classic",
    published_year: 1960,
    description: "A young girl learns about justice and morality in the Deep South.",
    available: false
  }
])
