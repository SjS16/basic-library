require "test_helper"

class BookTest < ActiveSupport::TestCase
  test "cannot add the same title by the same author twice, even with different casing" do
    book = Book.new(title: "the great gatsby", author: "F. SCOTT FITZGERALD")
    assert_not book.valid?
    assert book.errors[:title].present?
  end

  test "the same title by a different author is fine" do
    book = Book.new(title: "The Great Gatsby", author: "Someone Else")
    assert book.valid?
  end

  test "in_library scope excludes members' wishlist records" do
    wishlist = Book.create!(title: "Wishlisted", author: "Hopeful", in_library: false, available: false)
    assert_includes Book.in_library, books(:available_book)
    assert_not_includes Book.in_library, wishlist
  end

  test "current_borrower is whoever holds the current loan" do
    book = Book.create!(title: "Fresh Off The Shelf", author: "New Author", available: true)
    borrower = borrowers(:good_borrower)
    assert_nil book.current_borrower
    Loan.create!(book: book, borrower: borrower, checked_out_at: Time.current, due_date: 2.weeks.from_now)
    assert_equal borrower, book.current_borrower
  end
end
