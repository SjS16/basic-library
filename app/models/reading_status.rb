class ReadingStatus < ApplicationRecord
  belongs_to :borrower
  belongs_to :book
  
  # Status enum: want_to_read, currently_reading, read
  enum :status, {
    want_to_read: 0,
    currently_reading: 1,
    read: 2
  }
  
  validates :status, presence: true
  validates :rating, numericality: { greater_than_or_equal_to: 1, less_than_or_equal_to: 5, allow_nil: true }
  validates :borrower_id, uniqueness: { scope: :book_id, message: "has already marked this book" }
  
  # Scopes
  scope :want_to_read, -> { where(status: :want_to_read) }
  scope :currently_reading, -> { where(status: :currently_reading) }
  scope :read, -> { where(status: :read) }
  
  # Helper to get status badge info
  def status_color
    case status.to_sym
    when :want_to_read then "blue"
    when :currently_reading then "yellow"
    when :read then "green"
    end
  end
end
