class MembershipInvite < ApplicationRecord
  belongs_to :user

  # The owner invites an existing account (found by email) to join
  # the library. Nothing happens until the invitee accepts.
  enum :status, {
    pending: "pending",
    accepted: "accepted",
    declined: "declined"
  }

  validates :status, presence: true
  validate :no_duplicate_pending_invite, on: :create
  validate :user_not_already_a_member, on: :create

  scope :recent_first, -> { order(created_at: :desc) }

  private

  def no_duplicate_pending_invite
    return unless user

    if MembershipInvite.where(user: user, status: :pending).exists?
      errors.add(:base, "That account already has an invite waiting")
    end
  end

  def user_not_already_a_member
    return unless user

    if user.borrower_id.present?
      errors.add(:base, "That account is already a member of this library")
    end
  end
end
