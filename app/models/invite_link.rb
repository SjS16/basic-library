class InviteLink < ApplicationRecord
  validates :token, presence: true, uniqueness: true

  # One shareable signup link for the library. Anyone who signs up
  # through it becomes a member automatically. The owner can
  # regenerate it, which invalidates the old link everywhere it
  # was shared.
  def self.current
    first_or_create!(token: SecureRandom.urlsafe_base64(18))
  end

  def self.valid_token?(token)
    token.present? && current.token == token
  end

  def regenerate!
    update!(token: SecureRandom.urlsafe_base64(18))
  end
end
