class Notification < ApplicationRecord
  belongs_to :user
  belongs_to :book, optional: true
  belongs_to :borrower, optional: true

  # wishlist_book_arrived: a book on the member's to-be-read list
  # joined the library (book is set). member_joined: a new member
  # joined; sent to the owner (borrower is the member who joined).
  # borrow_request_received: a member asked to borrow a book; sent
  # to the owner (book and borrower set). borrow_request_approved
  # and borrow_request_declined: the outcome of a request, sent to
  # the member who asked (book and borrower set). book_recommended:
  # a member recommended a book; sent to the member it was
  # recommended to (book set, borrower is the recommender).
  KINDS = %w[ wishlist_book_arrived member_joined borrow_request_received
              borrow_request_approved borrow_request_declined book_recommended ].freeze
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

  # Tells the owner that a member has asked to borrow a book, so a
  # request is visible in the app even when email is not getting
  # through. The owner asking for their own book does not count.
  def self.borrow_request_received!(request)
    User.where(owner: true).find_each do |owner|
      next if owner.borrower_id == request.borrower_id

      create!(user: owner, kind: "borrow_request_received", book: request.book, borrower: request.borrower)
    end
  end

  # Tells the member who asked how their request turned out.
  def self.borrow_request_decided!(request)
    user = User.find_by(borrower_id: request.borrower_id)
    return unless user

    kind = request.approved? ? "borrow_request_approved" : "borrow_request_declined"
    create!(user: user, kind: kind, book: request.book, borrower: request.borrower)
  end

  # Tells a member that someone recommended a book to them. A
  # member record with no account yet has nobody to tell; the
  # recommendation itself will be waiting when they sign up.
  def self.book_recommended!(recommendation)
    user = User.find_by(borrower_id: recommendation.recipient_id)
    return unless user

    create!(user: user, kind: "book_recommended", book: recommendation.book, borrower: recommendation.recommender)
  end
end
