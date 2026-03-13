require "application_system_test_case"

class BooksTest < ApplicationSystemTestCase
  setup do
    @book = books(:available_book)
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
end
