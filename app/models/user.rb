class User < ApplicationRecord
  has_secure_password
  has_many :sessions, dependent: :destroy
  belongs_to :borrower, optional: true

  normalizes :email_address, with: ->(e) { e.strip.downcase }

  before_create :claim_borrower_record
  before_create :make_first_user_owner

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
