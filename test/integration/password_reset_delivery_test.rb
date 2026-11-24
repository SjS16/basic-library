require "test_helper"

class PasswordResetDeliveryTest < ActionDispatch::IntegrationTest
  test "requesting a password reset sends the email immediately" do
    user = users(:one)
    assert_difference -> { ActionMailer::Base.deliveries.count }, 1 do
      post passwords_path, params: { email_address: user.email_address }
    end
    assert_redirected_to new_session_path
  end

  test "requesting a reset for an unknown email sends nothing and answers the same way" do
    assert_no_difference -> { ActionMailer::Base.deliveries.count } do
      post passwords_path, params: { email_address: "nobody@example.com" }
    end
    assert_redirected_to new_session_path
  end
end
