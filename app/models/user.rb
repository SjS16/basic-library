class User < ApplicationRecord
  has_secure_password
  has_many :sessions, dependent: :destroy
  has_many :membership_requests, dependent: :destroy
  has_many :membership_invites, dependent: :destroy
  has_many :notifications, dependent: :destroy
  belongs_to :borrower, optional: true

  normalizes :email_address, with: ->(e) { e.strip.downcase }

  # A floor under password length: has_secure_password checks
  # that a password is present but sets no minimum, so without
  # this a one-character password would pass.
  validates :password, length: { minimum: 8 }, allow_nil: true

  before_create :claim_borrower_record
  before_create :make_first_user_owner

  # Grants this account membership of the library: links the member
  # record with this email, creating it first if none exists. Every
  # door into membership (owner pre-adding a record, an approved join
  # request, an accepted invite, the invite link) ends here.
  def activate_membership!(notify_owner: false)
    return borrower if borrower_id.present?

    record = Borrower.where("LOWER(email) = ?", email_address).first ||
             Borrower.create!(name: name.presence || email_address.split("@").first,
                              email: email_address,
                              standing: 100)
    update!(borrower: record)
    Notification.member_joined!(record) if notify_owner
    record
  end

  private

  # If a borrower record already exists with this email address, link it
  # so the new account inherits that borrower's loans and reading lists.
  def claim_borrower_record
    self.borrower ||= Borrower.where("LOWER(email) = ?", email_address).first
  end

  # The first account created owns the library.
  def make_first_user_owner
    self.owner = true if User.count.zero?
  end
end
