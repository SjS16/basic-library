require "test_helper"

class UserTest < ActiveSupport::TestCase
  test "downcases and strips email_address" do
    user = User.new(email_address: " DOWNCASED@EXAMPLE.COM ")
    assert_equal("downcased@example.com", user.email_address)
  end

  test "the first account created becomes the owner, later ones do not" do
    # The fixture library's owner reference would block deleting users.
    BookLibrary.update_all(owner_id: nil)
    User.delete_all
    first = User.create!(email_address: "first@example.com", password: "password")
    second = User.create!(email_address: "second@example.com", password: "password")
    assert first.owner?
    assert_not second.owner?
  end

  test "a new account claims the member record with its email" do
    user = User.create!(email_address: "john@example.com", password: "password")
    assert_equal borrowers(:excellent_borrower), user.borrower
  end

  test "activate_membership! creates and links a member record when none exists" do
    user = User.create!(name: "New Person", email_address: "new@example.com", password: "password")
    assert_nil user.borrower
    record = user.activate_membership!
    assert_equal record, user.reload.borrower
    assert_equal "New Person", record.name
    assert_equal "new@example.com", record.email
    assert_equal 100, record.standing
  end

  test "activate_membership! reuses an existing record and is a no-op for members" do
    user = User.create!(email_address: "jane@example.com", password: "password")
    assert_equal borrowers(:good_borrower), user.borrower
    assert_no_difference "Borrower.count" do
      user.activate_membership!
    end
  end

  test "a password shorter than eight characters is rejected" do
    user = User.new(email_address: "short@example.com", password: "short12")
    assert_not user.valid?
    assert user.errors[:password].present?
  end

  test "an eight character password is accepted" do
    user = User.new(email_address: "eight@example.com", password: "12345678")
    assert user.valid?
  end
end
