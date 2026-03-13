# db/seeds.rb

# Clean up existing data
Loan.destroy_all
Borrower.destroy_all
Book.destroy_all

puts "Creating books..."

# Create some sample books
books = Book.create!([
  {
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    genre: "Fantasy",
    published_year: 1937,
    description: "A hobbit named Bilbo goes on an unexpected adventure.",
    available: true,
    rating: 5
  },
  {
    title: "1984",
    author: "George Orwell",
    genre: "Dystopian",
    published_year: 1949,
    description: "A chilling vision of a totalitarian future.",
    available: true,
    rating: 5
  },
  {
    title: "Pride and Prejudice",
    author: "Jane Austen",
    genre: "Romance",
    published_year: 1813,
    description: "Elizabeth Bennet navigates love and social expectations.",
    available: true,
    rating: 4
  },
  {
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    genre: "Classic",
    published_year: 1925,
    description: "The mysterious Jay Gatsby and his obsession with Daisy Buchanan.",
    available: true,
    rating: 4
  },
  {
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    genre: "Classic",
    published_year: 1960,
    description: "A young girl learns about justice and morality in the Deep South.",
    available: true,
    rating: 5
  },
  {
    title: "Dune",
    author: "Frank Herbert",
    genre: "Science Fiction",
    published_year: 1965,
    description: "Political intrigue and ecological themes on the desert planet Arrakis.",
    available: true,
    rating: 5
  },
  {
    title: "The Catcher in the Rye",
    author: "J.D. Salinger",
    genre: "Coming of Age",
    published_year: 1951,
    description: "Holden Caulfield's journey through post-war America.",
    available: true,
    rating: 3
  }
])

puts "Created #{books.count} books"

puts "Creating borrowers..."

# Create borrowers with different standings
borrowers = Borrower.create!([
  {
    name: "Alice Johnson",
    email: "alice@example.com",
    standing: 100
  },
  {
    name: "Bob Smith",
    email: "bob@example.com",
    standing: 85
  },
  {
    name: "Carol Williams",
    email: "carol@example.com",
    standing: 60
  },
  {
    name: "David Brown",
    email: "david@example.com",
    standing: 45
  }
])

puts "Created #{borrowers.count} borrowers"

puts "Creating sample loans..."

# Alice has 2 books checked out (good standing)
Loan.create!([
  {
    borrower: borrowers[0],
    book: books[0],
    checked_out_at: 5.days.ago,
    due_date: 9.days.from_now,
    returned_at: nil
  },
  {
    borrower: borrowers[0],
    book: books[1],
    checked_out_at: 3.days.ago,
    due_date: 11.days.from_now,
    returned_at: nil
  }
])

# Bob has 1 overdue book
Loan.create!(
  borrower: borrowers[1],
  book: books[2],
  checked_out_at: 20.days.ago,
  due_date: 6.days.ago,
  returned_at: nil
)

# Carol has returned books late
Loan.create!([
  {
    borrower: borrowers[2],
    book: books[3],
    checked_out_at: 30.days.ago,
    due_date: 16.days.ago,
    returned_at: 10.days.ago  # returned 6 days late
  }
])

puts "Created sample loans"

# Update borrower standings based on loan history
borrowers.each(&:update_standing!)

puts "\nSeed data created successfully!"
puts "Borrowers: #{Borrower.count}"
puts "Books: #{Book.count}"
puts "Loans: #{Loan.count}"
puts "\nBorrower Standings:"
Borrower.all.each do |b|
  puts "  #{b.name}: #{b.standing}/100 (#{b.standing_status})"
end
