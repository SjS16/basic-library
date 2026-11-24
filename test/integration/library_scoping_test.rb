require "test_helper"

class LibraryScopingTest < ActionDispatch::IntegrationTest
  test "the books list shows only the current library's books" do
    other = BookLibrary.create!(name: "Someone Else's Library")
    Book.create!(title: "Not In This Library", author: "Outsider", in_library: true, available: true, book_library: other)

    sign_in_as(users(:one))
    get books_path(format: :json)
    assert_response :success
    titles = JSON.parse(response.body).map { |b| b["title"] }
    assert_includes titles, "The Great Gatsby"
    assert_not_includes titles, "Not In This Library"
  end

  test "the members list shows only the current library's members" do
    other = BookLibrary.create!(name: "Someone Else's Library")
    Borrower.create!(name: "Not Our Member", book_library: other)

    owner = users(:two)
    owner.update!(owner: true)
    sign_in_as(owner)
    get borrowers_path(format: :json)
    assert_response :success
    names = JSON.parse(response.body).map { |b| b["name"] }
    assert_includes names, "Jane Smith"
    assert_not_includes names, "Not Our Member"
  end
end
