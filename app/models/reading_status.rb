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

  # A to-be-read list is an intention queue, not an archive, so it is
  # capped. The read list is deliberately unlimited: it is the member's
  # history, ratings and notes included.
  TBR_LIMIT = 20
  validate :tbr_list_not_full, if: :want_to_read?

  # Scopes
  scope :want_to_read, -> { where(status: :want_to_read) }
  scope :currently_reading, -> { where(status: :currently_reading) }
  scope :read, -> { where(status: :read) }

  # Provenance: if this entry is on the list because someone
  # recommended the book and the member accepted, name them, and
  # keep their note attached to the entry.
  def accepted_recommendation
    Recommendation.where(recipient: borrower, book: book, status: :accepted).order(created_at: :desc).first
  end

  def recommended_by_name
    accepted_recommendation&.recommender&.name
  end

  def recommendation_note
    accepted_recommendation&.note
  end

  # Helper to get status badge info
  def status_color
    case status.to_sym
    when :want_to_read then "blue"
    when :currently_reading then "yellow"
    when :read then "green"
    end
  end

  private

  def tbr_list_not_full
    return unless borrower

    others = borrower.reading_statuses.where(status: :want_to_read)
    others = others.where.not(id: id) if persisted?
    if others.count >= TBR_LIMIT
      errors.add(:base, "The to-be-read list is full (max #{TBR_LIMIT}). Move a book to Read or remove one to add another.")
    end
  end
end
