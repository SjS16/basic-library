require "test_helper"

class BorrowRequestsTest < ActionDispatch::IntegrationTest
  setup do
    @owner = users(:two)
    @owner.update!(owner: true)
    @member = users(:one)
    @member.update!(borrower: borrowers(:good_borrower))
    # A fresh book: the fixture copy of Gatsby already has a loan
    # against it, which would (correctly) block new requests.
    @book = Book.create!(title: "A Fresh Book", author: "New Author", available: true)
  end

  test "member requests a book and the owner's approval checks it out to them" do
    sign_in_as(@member)
    assert_difference "BorrowRequest.count", 1 do
      post borrow_requests_path(format: :json),
           params: { borrow_request: { book_id: @book.id } }, as: :json
    end
    assert_response :created

    request = BorrowRequest.last
    sign_in_as(@owner)
    assert_difference "Loan.count", 1 do
      post approve_borrow_request_path(request, format: :json), as: :json
    end
    assert_response :success
    assert_equal "approved", request.reload.status
    assert_not @book.reload.available
    assert_equal borrowers(:good_borrower), @book.current_borrower
  end

  test "an account without a member record cannot request books" do
    outsider = User.create!(email_address: "outsider@example.com", password: "password")
    sign_in_as(outsider)
    assert_no_difference "BorrowRequest.count" do
      post borrow_requests_path(format: :json),
           params: { borrow_request: { book_id: @book.id } }, as: :json
    end
    assert_response :forbidden
  end

  test "the owner cannot approve a request once someone else has the book" do
    sign_in_as(@member)
    post borrow_requests_path(format: :json),
         params: { borrow_request: { book_id: @book.id } }, as: :json
    request = BorrowRequest.last

    Loan.create!(book: @book, borrower: borrowers(:excellent_borrower),
                 checked_out_at: Time.current, due_date: 2.weeks.from_now)

    sign_in_as(@owner)
    assert_no_difference "Loan.count" do
      post approve_borrow_request_path(request, format: :json), as: :json
    end
    assert_response :unprocessable_entity
    assert_equal "pending", request.reload.status
  end

  test "a member can cancel their own pending request" do
    sign_in_as(@member)
    post borrow_requests_path(format: :json),
         params: { borrow_request: { book_id: @book.id } }, as: :json
    request = BorrowRequest.last
    post cancel_borrow_request_path(request, format: :json), as: :json
    assert_response :success
    assert_equal "cancelled", request.reload.status
  end
end
