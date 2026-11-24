require "test_helper"

class TitleRequestsTest < ActionDispatch::IntegrationTest
  setup do
    @borrower = borrowers(:good_borrower)
    @member = User.create!(
      email_address: "title-member@example.com",
      password: "password",
      name: "Title Member",
      borrower: @borrower
    )
  end

  test "requesting a book the library owns creates a borrow request" do
    sign_in_as(@member)
    book = Book.create!(title: "Project Hail Mary", author: "Andy Weir", available: true)

    assert_difference "BorrowRequest.count", 1 do
      post "/borrowers/#{@borrower.id}/title_requests.json",
           params: { book: { title: "project hail mary", author: "ANDY WEIR" } },
           as: :json
    end

    assert_response :created
    assert_equal "requested", response.parsed_body["outcome"]
    assert_equal book.id, BorrowRequest.last.book_id
  end

  test "requesting a book nobody owns puts a wish on the to-be-read list" do
    sign_in_as(@member)

    assert_difference "Book.count", 1 do
      post "/borrowers/#{@borrower.id}/title_requests.json",
           params: { book: { title: "The Midnight Library", author: "Matt Haig" } },
           as: :json
    end

    assert_response :created
    assert_equal "wishlisted", response.parsed_body["outcome"]
    book = Book.find_by(title: "The Midnight Library")
    assert_not book.in_library?
    status = @borrower.reading_statuses.find_by(book: book)
    assert_equal "want_to_read", status.status
  end

  test "cannot request for someone else" do
    sign_in_as(@member)

    post "/borrowers/#{borrowers(:excellent_borrower).id}/title_requests.json",
         params: { book: { title: "Dune", author: "Frank Herbert" } },
         as: :json

    assert_response :forbidden
  end
end
