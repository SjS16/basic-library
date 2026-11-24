require "test_helper"

class MembershipInviteTest < ActiveSupport::TestCase
  test "an invite for a non-member account is valid" do
    assert MembershipInvite.new(user: users(:one)).valid?
  end

  test "cannot invite the same account twice while one is pending" do
    MembershipInvite.create!(user: users(:one))
    assert_not MembershipInvite.new(user: users(:one)).valid?
  end

  test "cannot invite an account that is already a member" do
    users(:one).update!(borrower: borrowers(:good_borrower))
    assert_not MembershipInvite.new(user: users(:one)).valid?
  end

  test "can invite again after a decline" do
    MembershipInvite.create!(user: users(:one), status: :declined)
    assert MembershipInvite.new(user: users(:one)).valid?
  end
end
