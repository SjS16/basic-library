class MembershipRequest < ApplicationRecord
  belongs_to :user

  # A signed-in account asks to become a member of the library.
  # The owner approves (which creates/links the member record) or
  # declines. Membership is granted, never automatic: this library
  # is for the owner's own circle.
  enum :status, {
    pending: "pending",
    approved: "approved",
    declined: "declined"
  }

  validates :status, presence: true
  validate :no_duplicate_pending_request, on: :create
  validate :user_not_already_a_member, on: :create

  scope :recent_first, -> { order(created_at: :desc) }

  private

  def no_duplicate_pending_request
    return unless user

    if MembershipRequest.where(user: user, status: :pending).exists?
      errors.add(:base, "You already have a request to join waiting for approval")
    end
  end

  def user_not_already_a_member
    return unless user

    if user.borrower_id.present?
      errors.add(:base, "You are already a member of this library")
    end
  end
end
