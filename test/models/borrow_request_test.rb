require "test_helper"

class BorrowRequestTest < ActiveSupport::TestCase
  setup do
    @borrower = Borrower.create!(name: "Reader", email: "reader@example.com", standing: 100)
    @book = Book.create!(title: "Dune", author: "Frank Herbert", available: true)
  end

  test "a member can request a book the library owns" do
    request = BorrowRequest.new(borrower: @borrower, book: @book)
    assert request.valid?
    assert_equal "pending", request.status
  end

  test "cannot request a book the library does not own" do
    wishlist_book = Book.create!(title: "Someday", author: "Hopeful", in_library: false, available: false)
    request = BorrowRequest.new(borrower: @borrower, book: wishlist_book)
    assert_not request.valid?
  end

  test "cannot request the same book twice while a request is pending" do
    BorrowRequest.create!(borrower: @borrower, book: @book)
    assert_not BorrowRequest.new(borrower: @borrower, book: @book).valid?
  end

  test "can request again after a request was declined" do
    BorrowRequest.create!(borrower: @borrower, book: @book, status: :declined)
    assert BorrowRequest.new(borrower: @borrower, book: @book).valid?
  end

  test "cannot request a book already on loan to the same member" do
    Loan.create!(book: @book, borrower: @borrower, checked_out_at: Time.current, due_date: 2.weeks.from_now)
    assert_not BorrowRequest.new(borrower: @borrower, book: @book).valid?
  end
end
