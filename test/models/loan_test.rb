require "test_helper"

class LoanTest < ActiveSupport::TestCase
  test "should create loan with default due date" do
    book = books(:available_book)
    borrower = borrowers(:excellent_borrower)

    loan = Loan.create!(book: book, borrower: borrower)

    assert_not_nil loan.due_date
    assert loan.due_date > Time.current
  end

  test "should mark book unavailable after checkout" do
    book = books(:available_book)
    borrower = borrowers(:excellent_borrower)

    assert book.available

    loan = borrower.loans.create!(book: book, due_date: 14.days.from_now)
    book.reload

    refute book.available
  end

  test "should mark book available after return" do
    loan = loans(:active_loan)
    book = loan.book

    book.update(available: false)
    loan.update(returned_at: Time.current)
    book.reload

    assert book.available
  end

  test "overdue? returns true when past due date" do
    loan = loans(:overdue_loan)
    assert loan.overdue?
  end

  test "overdue? returns false when not past due date" do
    loan = loans(:active_loan)
    refute loan.overdue?
  end

  test "overdue? returns false for returned loans" do
    loan = loans(:returned_loan)
    refute loan.overdue?
  end

  test "days_overdue calculates correctly" do
    loan = loans(:overdue_loan)
    assert loan.days_overdue > 0
  end

  test "days_overdue returns 0 for on-time loans" do
    loan = loans(:active_loan)
    assert loan.days_overdue <= 0, "Expected non-overdue loan to have days_overdue <= 0"
  end
end
