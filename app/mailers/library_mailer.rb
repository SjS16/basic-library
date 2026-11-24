class LibraryMailer < ApplicationMailer
  # To the owner: a member has asked to borrow a book.
  def borrow_request_received(request)
    @borrower = request.borrower
    @book = request.book
    owner = User.find_by(owner: true)
    return unless owner

    mail to: owner.email_address, subject: "Borrow request: #{@book.title}"
  end

  # To the owner: an account has asked to join the library.
  def membership_request_received(request)
    @user = request.user
    owner = User.find_by(owner: true)
    return unless owner

    mail to: owner.email_address,
         subject: "Join request from #{@user.name.presence || @user.email_address}"
  end

  # To the member: a book they have out is due tomorrow.
  def due_tomorrow(loan)
    @loan = loan
    @book = loan.book
    email = member_email(loan.borrower)
    return unless email

    mail to: email, subject: "Due tomorrow: #{@book.title}"
  end

  # To the member: a book they have out is due today.
  def due_today(loan)
    @loan = loan
    @book = loan.book
    email = member_email(loan.borrower)
    return unless email

    mail to: email, subject: "Due today: #{@book.title}"
  end

  # To the member: the owner's manual nudge about an overdue book.
  def overdue_nudge(loan)
    @loan = loan
    @book = loan.book
    @borrower = loan.borrower
    email = member_email(loan.borrower)
    return unless email

    mail to: email, subject: "Overdue: #{@book.title}"
  end

  private

  # A member can be reached at their account email when they have
  # one, or at the email on their member record when they don't.
  def member_email(borrower)
    User.find_by(borrower_id: borrower.id)&.email_address.presence || borrower.email.presence
  end
end
