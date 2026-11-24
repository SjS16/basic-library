require "test_helper"

class BookIsbnTest < ActionDispatch::IntegrationTest
  setup do
    @borrower = borrowers(:good_borrower)
    @member = User.create!(
      email_address: "isbn-member@example.com",
      password: "password",
      name: "Isbn Member",
      borrower: @borrower
    )
    @owner = users(:two)
    @owner.update!(owner: true)
  end

  test "title request matches by ISBN even when the author is written differently" do
    Book.create!(title: "Project Hail Mary", author: "Andy Weir", isbn: "9780593135204", available: true)
    sign_in_as(@member)

    assert_difference "BorrowRequest.count", 1 do
      post "/borrowers/#{@borrower.id}/title_requests.json",
           params: { book: { title: "Project Hail Mary", author: "Weir, Andy", isbn: "9780593135204" } },
           as: :json
    end

    assert_response :created
    assert_equal "requested", response.parsed_body["outcome"]
  end

  test "wishlist add stores the ISBN, and the owner's add claims that record by ISBN" do
    sign_in_as(@member)
    post "/borrowers/#{@borrower.id}/wishlist_books.json",
         params: { book: { title: "The Midnight Library", author: "Matt Haig", isbn: "9780525559474" }, status: "want_to_read" },
         as: :json
    assert_response :created
    wish = Book.find_by(isbn: "9780525559474")
    assert_not wish.in_library?

    sign_in_as(@owner)
    assert_no_difference "Book.count" do
      post "/books.json",
           params: { book: { title: "Midnight Library, The", author: "Haig, Matt", isbn: "9780525559474" } },
           as: :json
    end
    assert wish.reload.in_library?
  end
end
