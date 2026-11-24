class BookLibrary < ApplicationRecord
  # Named BookLibrary because the app itself is the Library module
  # (config/application.rb): a top-level Library model could never
  # load alongside it.
  belongs_to :owner, class_name: "User", optional: true
  has_many :books, dependent: :destroy
  has_many :borrowers, dependent: :destroy

  validates :name, presence: true

  # Phase 1 of the multi-library design (see the design note):
  # exactly one library exists, and this is how the app finds it.
  # Later phases choose the library from the signed-in user's
  # ownerships and memberships instead of defaulting to the one.
  def self.default_library
    first || create!(name: "My Library", owner: User.where(owner: true).first || User.first)
  end
end
