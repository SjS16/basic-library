class Book < ApplicationRecord
  has_many :loans, dependent: :destroy
  has_many :borrowers, through: :loans
  has_many :reading_statuses, dependent: :destroy
  has_many :borrow_requests, dependent: :destroy

  # When a wished-for book joins the library, the members who have
  # it on their to-be-read list get an in-app notification.
  after_save :notify_readers_of_arrival, if: -> { in_library? && saved_change_to_in_library? }

  # Books the library actually owns. Books members add to their own
  # to-be-read lists exist as records too, flagged in_library: false.
  scope :in_library, -> { where(in_library: true) }

  validates :title, presence: true
  validate :no_duplicate_title_and_author
  # An ISBN identifies one edition; two records sharing one would
  # be the same book twice. Blank is fine (older records have none).
  validates :isbn, uniqueness: true, allow_blank: true

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

  private

  def notify_readers_of_arrival
    reading_statuses.want_to_read.find_each do |status|
      user = User.find_by(borrower_id: status.borrower_id)
      next unless user

      Notification.find_or_create_by(user: user, kind: "wishlist_book_arrived", book: self)
    end
  end

  # The same title by the same author counts as a duplicate no
  # matter the casing of either. The built-in uniqueness validator
  # only lowercases the attribute itself, not its scope, so the
  # same author typed in a different case slipped through.
  # An edition note makes a copy distinct: two copies of the same
  # book are allowed when their editions differ (including one
  # with a note and one without).
  def no_duplicate_title_and_author
    return if title.blank?

    duplicate = Book.where("LOWER(title) = ? AND LOWER(COALESCE(author, '')) = ? AND LOWER(COALESCE(edition, '')) = ?",
                           title.strip.downcase, author.to_s.strip.downcase, edition.to_s.strip.downcase)
    duplicate = duplicate.where.not(id: id) if persisted?
    errors.add(:title, "is already in the library for this author and edition — add an edition note to keep another copy") if duplicate.exists?
  end
end
