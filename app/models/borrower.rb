class Borrower < ApplicationRecord
  has_many :loans, dependent: :destroy
  has_many :books, through: :loans
  has_many :reading_statuses, dependent: :destroy
  has_many :books_to_read, -> { where(reading_statuses: { status: 0 }) }, through: :reading_statuses, source: :book
  has_many :books_reading, -> { where(reading_statuses: { status: 1 }) }, through: :reading_statuses, source: :book
  has_many :books_read, -> { where(reading_statuses: { status: 2 }) }, through: :reading_statuses, source: :book
  
  validates :name, presence: true
  validates :email, uniqueness: true, allow_blank: true
  validates :standing, numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 100 }
  
  # Maximum number of books a borrower can have at once
  MAX_BOOKS = 5
  
  # Get currently checked out books (not returned)
  def current_loans
    loans.where(returned_at: nil)
  end
  
  def checked_out_books
    books.joins(:loans).where(loans: { returned_at: nil })
  end
  
  # Check if borrower can checkout more books
  def can_checkout?
    current_loans.count < MAX_BOOKS && standing >= 50
  end
  
  # Get overdue loans
  def overdue_loans
    current_loans.where("due_date < ?", Time.current)
  end
  
  # Calculate and update standing based on loan history
  def update_standing!
    return if loans.empty?
    
    total_loans = loans.where.not(returned_at: nil).count
    return if total_loans.zero?
    
    # Count late returns (returned after due date)
    late_returns = loans.where("returned_at > due_date").count
    
    # Count currently overdue
    overdue_count = overdue_loans.count
    
    # Calculate standing: start at 100, deduct points for issues
    new_standing = 100
    new_standing -= (late_returns * 10) # -10 points per late return
    new_standing -= (overdue_count * 20) # -20 points per currently overdue book
    
    # Apply a grace factor based on total completed loans (good behavior)
    if total_loans > 10
      grace = [((total_loans - late_returns) / total_loans.to_f) * 10, 10].min
      new_standing += grace.to_i
    end
    
    # Keep standing between 0 and 100
    new_standing = [[new_standing, 0].max, 100].min
    
    update(standing: new_standing)
  end
  
  # Get standing status as a string
  def standing_status
    case standing
    when 90..100 then "Excellent"
    when 70..89 then "Good"
    when 50..69 then "Fair"
    when 30..49 then "Poor"
    else "Restricted"
    end
  end
  
  # Get standing color class for UI
  def standing_color
    case standing
    when 90..100 then "green"
    when 70..89 then "blue"
    when 50..69 then "yellow"
    when 30..49 then "orange"
    else "red"
    end
  end
end
