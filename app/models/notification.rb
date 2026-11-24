class Notification < ApplicationRecord
  belongs_to :user
  belongs_to :book, optional: true
  belongs_to :borrower, optional: true

  # wishlist_book_arrived: a book on the member's to-be-read list
  # joined the library (book is set). member_joined: a new member
  # joined; sent to the owner (borrower is the member who joined).
  KINDS = %w[ wishlist_book_arrived member_joined ].freeze
  validates :kind, inclusion: { in: KINDS }

  scope :recent_first, -> { order(created_at: :desc) }

  # Tells the library's owner that a new member has joined. Used by
  # the member-initiated doors (the invite link, email invites);
  # owner-approved joins do not need it, the owner was just there.
  def self.member_joined!(borrower)
    User.where(owner: true).find_each do |owner|
      next if owner.borrower_id == borrower.id

      find_or_create_by(user: owner, kind: "member_joined", borrower: borrower)
    end
  end
end
