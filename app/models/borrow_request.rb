class BorrowRequest < ApplicationRecord
  belongs_to :borrower
  belongs_to :book

  # A member asks to borrow a book; the owner approves (which checks
  # the book out to them) or declines. Members can cancel while pending.
  enum :status, {
    pending: "pending",
    approved: "approved",
    declined: "declined",
    cancelled: "cancelled"
  }

  validates :status, presence: true
  validate :book_must_be_in_library, on: :create
  validate :no_duplicate_pending_request, on: :create
  validate :borrower_does_not_already_have_book, on: :create

  scope :recent_first, -> { order(created_at: :desc) }

  private

  def book_must_be_in_library
    errors.add(:book, "is not part of the library") if book && !book.in_library?
  end

  def no_duplicate_pending_request
    return unless borrower && book

    if BorrowRequest.where(borrower: borrower, book: book, status: :pending).exists?
      errors.add(:base, "You already have a pending request for this book")
    end
  end

  def borrower_does_not_already_have_book
    return unless borrower && book

    if borrower.current_loans.exists?(book_id: book.id)
      errors.add(:base, "You already have this book checked out")
    end
  end
end
