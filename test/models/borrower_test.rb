require "test_helper"

class BorrowerTest < ActiveSupport::TestCase
  test "should have valid standing by default" do
    borrower = Borrower.new(name: "Test User", email: "test@example.com")
    assert_equal 100, borrower.standing
  end

  test "standing should return correct status" do
    borrower = borrowers(:excellent_borrower)
    assert_equal "Excellent", borrower.standing_status

    borrower.update(standing: 75)
    assert_equal "Good", borrower.standing_status

    borrower.update(standing: 55)
    assert_equal "Fair", borrower.standing_status

    borrower.update(standing: 35)
    assert_equal "Poor", borrower.standing_status

    borrower.update(standing: 10)
    assert_equal "Restricted", borrower.standing_status
  end

  test "can_checkout should return true when standing >= 50 and loans < 5" do
    borrower = borrowers(:excellent_borrower)
    assert borrower.can_checkout?
  end

  test "can_checkout should return false when standing < 50" do
    borrower = borrowers(:low_standing_borrower)
    refute borrower.can_checkout?
  end

  test "can_checkout should return false when 5 books checked out" do
    borrower = borrowers(:excellent_borrower)
    # Borrower already has 1 active loan from fixtures, so create 4 more to reach max of 5
    4.times do |i|
      book = Book.create!(
        title: "Book #{i}",
        author: "Author #{i}",
        available: true
      )
      borrower.loans.create!(book: book, checked_out_at: Time.current, due_date: 14.days.from_now)
    end
    refute borrower.can_checkout?
  end

  test "current_loans returns only unreturned loans" do
    borrower = borrowers(:excellent_borrower)
    active_count = borrower.current_loans.count
    total_count = borrower.loans.count
    assert active_count < total_count
  end

  test "update_standing decreases standing for late returns" do
    borrower = borrowers(:excellent_borrower)
    initial_standing = borrower.standing
    
    # Create an overdue loan
    loan = borrower.loans.create!(
      book: books(:available_book),
      due_date: 5.days.ago
    )
    
    borrower.update_standing!
    assert borrower.standing < initial_standing
  end
end
