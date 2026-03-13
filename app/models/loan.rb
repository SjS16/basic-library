class Loan < ApplicationRecord
  belongs_to :borrower
  belongs_to :book
  
  validates :checked_out_at, :due_date, presence: true
  validate :borrower_can_checkout, on: :create
  validate :book_is_available, on: :create
  
  before_create :set_defaults
  after_create :mark_book_unavailable
  after_save :update_book_availability, if: :saved_change_to_returned_at?
  after_save :update_borrower_standing, if: :saved_change_to_returned_at?
  
  scope :active, -> { where(returned_at: nil) }
  scope :returned, -> { where.not(returned_at: nil) }
  scope :overdue, -> { active.where("due_date < ?", Time.current) }
  
  # Check if loan is overdue
  def overdue?
    returned_at.nil? && due_date < Time.current
  end
  
  # Check if loan was returned late
  def returned_late?
    returned_at.present? && returned_at > due_date
  end
  
  # Days overdue (negative if not yet due)
  def days_overdue
    return 0 if returned_at.present?
    ((Time.current - due_date) / 1.day).to_i
  end
  
  # Return the book
  def return_book!
    update(returned_at: Time.current)
  end
  
  private
  
  def set_defaults
    self.checked_out_at ||= Time.current
    self.due_date ||= 2.weeks.from_now
  end
  
  def borrower_can_checkout
    unless borrower&.can_checkout?
      errors.add(:base, "Borrower cannot checkout more books (max #{Borrower::MAX_BOOKS} or standing too low)")
    end
  end
  
  def book_is_available
    if book && !book.available?
      errors.add(:book, "is not available for checkout")
    end
  end
  
  def mark_book_unavailable
    book.update(available: false)
  end
  
  def update_book_availability
    if returned_at.present?
      book.update(available: true)
    end
  end
  
  def update_borrower_standing
    borrower.update_standing!
  end
end
