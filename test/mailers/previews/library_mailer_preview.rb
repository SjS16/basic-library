# Preview all emails at http://localhost:3000/rails/mailers
class LibraryMailerPreview < ActionMailer::Preview
  def borrow_request_received
    request = BorrowRequest.first || BorrowRequest.new(
      borrower: Borrower.new(name: "Preview Member"),
      book: Book.new(title: "The Preview Book", author: "An Author")
    )
    LibraryMailer.borrow_request_received(request)
  end

  def membership_request_received
    request = MembershipRequest.first || MembershipRequest.new(
      user: User.new(name: "Preview Person", email_address: "person@example.com")
    )
    LibraryMailer.membership_request_received(request)
  end

  def due_tomorrow
    LibraryMailer.due_tomorrow(preview_loan(1.day.from_now))
  end

  def due_today
    LibraryMailer.due_today(preview_loan(Time.current))
  end

  def overdue_nudge
    LibraryMailer.overdue_nudge(preview_loan(3.days.ago))
  end

  private

  def preview_loan(due)
    Loan.where(returned_at: nil).first || Loan.new(
      borrower: Borrower.new(name: "Preview Member", email: "member@example.com"),
      book: Book.new(title: "The Preview Book", author: "An Author"),
      checked_out_at: 2.weeks.ago,
      due_date: due
    )
  end
end
