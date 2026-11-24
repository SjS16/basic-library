require "application_system_test_case"

class BooksTest < ApplicationSystemTestCase
  setup do
    @book = books(:available_book)
    sign_in_via_form(users(:one))
  end

  test "visiting the books index" do
    visit books_path
    # Wait for React to mount
    assert_selector "#react-root", wait: 10
    # The actual content is rendered by React based on JSON data
    assert_text @book.title
  end

  test "viewing a book" do
    visit books_path
    assert_selector "#react-root", wait: 10
    # Check that book data is displayed
    within "#react-root" do
      assert_text @book.title
      assert_text @book.author
    end
  end

  private

  # System tests drive a real browser, so the cookie-based
  # sign_in_as helper (integration tests only) cannot help here.
  # Go through the sign-in form like a person would. Landing on a
  # page with the React shell proves the sign-in worked, since the
  # sign-in page itself deliberately has no #react-root.
  def sign_in_via_form(user)
    visit new_session_path
    fill_in "Email address", with: user.email_address
    fill_in "Password", with: "password"
    click_on "Sign in"
    assert_selector "#react-root", wait: 10
  end
end
