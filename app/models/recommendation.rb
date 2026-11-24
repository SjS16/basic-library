class Recommendation < ApplicationRecord
  belongs_to :recommender, class_name: "Borrower"
  belongs_to :recipient, class_name: "Borrower"
  belongs_to :book

  # A recommendation is a title one member presses on another:
  # pending until the recipient decides, then accepted (it joined
  # their to-be-read list) or declined.
  enum :status, { pending: 0, accepted: 1, declined: 2 }

  validates :recommender_id, uniqueness: {
    scope: [ :recipient_id, :book_id ],
    conditions: -> { where(status: :pending) },
    message: "has already recommended this book to them"
  }
  validate :recommender_is_not_the_recipient

  scope :recent_first, -> { order(created_at: :desc) }

  private

  def recommender_is_not_the_recipient
    if recommender_id.present? && recommender_id == recipient_id
      errors.add(:recipient, "cannot be the person making the recommendation")
    end
  end
end
