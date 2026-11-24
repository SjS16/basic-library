require "test_helper"

class MembershipRequestTest < ActiveSupport::TestCase
  test "an account without membership can ask to join" do
    assert MembershipRequest.new(user: users(:one)).valid?
  end

  test "cannot ask twice while a request is pending" do
    MembershipRequest.create!(user: users(:one))
    assert_not MembershipRequest.new(user: users(:one)).valid?
  end

  test "a member cannot ask to join" do
    users(:one).update!(borrower: borrowers(:good_borrower))
    assert_not MembershipRequest.new(user: users(:one)).valid?
  end

  test "can ask again after being declined" do
    MembershipRequest.create!(user: users(:one), status: :declined)
    assert MembershipRequest.new(user: users(:one)).valid?
  end
end
