class Book < ApplicationRecord
  has_many :loans, dependent: :destroy
  has_many :borrowers, through: :loans
  has_many :reading_statuses, dependent: :destroy

  # Get current loan (if book is checked out)
  def current_loan
    loans.find_by(returned_at: nil)
  end

  # Get current borrower (if book is checked out)
  def current_borrower
    current_loan&.borrower
  end

  # Check if book is overdue
  def overdue?
    current_loan&.overdue? || false
  end
end
