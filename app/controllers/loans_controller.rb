class LoansController < ApplicationController
  before_action :require_owner, only: [ :overdue, :bother, :update ]

  # GET /loans/overdue.json — every book currently overdue, oldest
  # due date first, for the owner's home page list.
  def overdue
    loans = Loan.overdue.includes(:book, :borrower).order(:due_date)
    render json: loans.map { |loan|
      {
        id: loan.id,
        due_date: loan.due_date,
        days_overdue: loan.days_overdue,
        book: { id: loan.book.id, title: loan.book.title, author: loan.book.author },
        borrower: { id: loan.borrower.id, name: loan.borrower.name, email: member_email_for(loan.borrower) }
      }
    }
  end

  # POST /loans/:id/bother.json — owner only. Sends the member a
  # friendly nudge about an overdue book, by email.
  def bother
    loan = Loan.find(params[:id])
    email = member_email_for(loan.borrower)
    unless email
      return render json: { error: "No email on file for #{loan.borrower.name}, so there is nowhere to send a nudge." }, status: :unprocessable_entity
    end

    LibraryMailer.overdue_nudge(loan).deliver_now
    render json: { ok: true }
  rescue StandardError => e
    Rails.logger.error("Bother email failed: #{e.class}: #{e.message}")
    render json: { error: "The email could not be sent. Mail may not be configured yet." }, status: :unprocessable_entity
  end

  # PATCH /loans/:id.json — owner only. Moves a loan's due date (a
  # renewal, a favour, a correction). Changing the date clears the
  # reminder stamps, so the day-before and day-due emails are
  # worked out fresh against the new date.
  def update
    loan = Loan.find(params[:id])
    new_due = params.dig(:loan, :due_date)
    if new_due.blank?
      return render json: { error: "A due date is required." }, status: :unprocessable_entity
    end

    if loan.update(due_date: new_due, due_soon_reminder_sent_at: nil, due_today_reminder_sent_at: nil)
      render json: { id: loan.id, due_date: loan.due_date }
    else
      render json: { error: loan.errors.full_messages.to_sentence }, status: :unprocessable_entity
    end
  end

  private

  def member_email_for(borrower)
    User.find_by(borrower_id: borrower.id)&.email_address.presence || borrower.email.presence
  end
end
