require "test_helper"

class InviteLinkTest < ActiveSupport::TestCase
  test "current creates a single link with a token" do
    link = InviteLink.current
    assert link.token.present?
    assert_equal link, InviteLink.current
  end

  test "valid_token? accepts the current token only" do
    token = InviteLink.current.token
    assert InviteLink.valid_token?(token)
    assert_not InviteLink.valid_token?("bogus-token")
    assert_not InviteLink.valid_token?(nil)
    assert_not InviteLink.valid_token?("")
  end

  test "regenerating invalidates the old token" do
    link = InviteLink.current
    old_token = link.token
    link.regenerate!
    assert_not InviteLink.valid_token?(old_token)
    assert InviteLink.valid_token?(link.token)
  end
end
