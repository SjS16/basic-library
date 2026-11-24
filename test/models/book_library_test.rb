require "test_helper"

class BookLibraryTest < ActiveSupport::TestCase
  test "default_library returns the existing library" do
    assert_equal book_libraries(:main), BookLibrary.default_library
  end

  test "a book created without a library joins the default library" do
    book = Book.create!(title: "No Library Given", author: "Some Author", in_library: true, available: true)
    assert_equal book_libraries(:main), book.book_library
  end

  test "a member created without a library joins the default library" do
    borrower = Borrower.create!(name: "No Library Given")
    assert_equal book_libraries(:main), borrower.book_library
  end

  test "the same title and author is allowed in a different library" do
    other = BookLibrary.create!(name: "Another Library")
    book = Book.new(title: "The Great Gatsby", author: "F. Scott Fitzgerald", book_library: other, in_library: true, available: true)
    assert book.valid?, book.errors.full_messages.to_sentence
  end

  test "the same isbn is allowed in a different library" do
    other = BookLibrary.create!(name: "Another Library")
    Book.create!(title: "First", author: "A", isbn: "9780000000001", in_library: true, available: true, book_library: book_libraries(:main))
    second = Book.new(title: "Second", author: "B", isbn: "9780000000001", in_library: true, available: true, book_library: other)
    assert second.valid?, second.errors.full_messages.to_sentence
  end
end
