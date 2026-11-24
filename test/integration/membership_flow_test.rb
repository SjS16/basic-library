require "test_helper"

class MembershipFlowTest < ActionDispatch::IntegrationTest
  setup do
    @owner = users(:two)
    @owner.update!(owner: true)
  end

  test "ask to join, the owner approves, and the account becomes a member" do
    newcomer = User.create!(name: "New Friend", email_address: "friend@example.com", password: "password")
    sign_in_as(newcomer)
    assert_difference "MembershipRequest.count", 1 do
      post membership_requests_path(format: :json), as: :json
    end
    assert_response :created

    request = MembershipRequest.last
    sign_in_as(@owner)
    post approve_membership_request_path(request, format: :json), as: :json
    assert_response :success
    assert newcomer.reload.borrower_id.present?
    assert_equal "New Friend", newcomer.borrower.name
  end

  test "owner invites an existing account by email and the invitee accepts" do
    invitee = User.create!(name: "Invited", email_address: "invited@example.com", password: "password")
    sign_in_as(@owner)
    assert_difference "MembershipInvite.count", 1 do
      post membership_invites_path(format: :json), params: { email: "invited@example.com" }, as: :json
    end
    assert_response :created

    invite = MembershipInvite.last
    sign_in_as(invitee)
    post accept_membership_invite_path(invite, format: :json), as: :json
    assert_response :success
    assert invitee.reload.borrower_id.present?
    assert_equal "accepted", invite.reload.status
  end

  test "the owner cannot invite an email that has no account" do
    sign_in_as(@owner)
    assert_no_difference "MembershipInvite.count" do
      post membership_invites_path(format: :json), params: { email: "ghost@example.com" }, as: :json
    end
    assert_response :unprocessable_entity
  end

  test "signing up through the invite link grants membership" do
    token = InviteLink.current.token
    assert_difference "User.count", 1 do
      post registration_path, params: {
        invite_token: token,
        user: { name: "Via Link", email_address: "link@example.com",
                password: "password", password_confirmation: "password" }
      }
    end
    user = User.find_by(email_address: "link@example.com")
    assert user.borrower_id.present?
  end

  test "signing up without the invite link does not grant membership" do
    post registration_path, params: {
      user: { name: "Walk In", email_address: "walkin@example.com",
              password: "password", password_confirmation: "password" }
    }
    user = User.find_by(email_address: "walkin@example.com")
    assert_nil user.borrower_id
  end

  test "name check finds same-name members and accounts, owner only" do
    users(:one).update!(name: "John Doe")
    sign_in_as(@owner)
    get name_check_borrowers_path, params: { name: "John Doe" }, as: :json
    assert_response :success
    body = JSON.parse(response.body)
    assert_equal [ "John Doe" ], body["borrowers"].map { |b| b["name"] }
    assert_equal [ "John Doe" ], body["accounts"].map { |a| a["name"] }

    sign_in_as(users(:one))
    get name_check_borrowers_path, params: { name: "John Doe" }, as: :json
    assert_response :redirect
  end
end
