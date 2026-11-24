require "test_helper"

class BookPageTest < ActionDispatch::IntegrationTest
  setup do
    @owner = users(:two)
    @owner.update!(owner: true)
    # A fresh book: the fixture books already have loans against
    # them, so they are never truly "available" to test with.
    @book = Book.create!(title: "A Fresh Book", author: "New Author", available: true)
  end

  test "the book JSON names the member who currently has it" do
    Loan.create!(book: @book, borrower: borrowers(:good_borrower),
                 checked_out_at: Time.current, due_date: 2.weeks.from_now)
    sign_in_as(@owner)
    get book_path(@book, format: :json), as: :json
    assert_response :success
    body = JSON.parse(response.body)
    assert_equal borrowers(:good_borrower).id, body.dig("current_loan", "borrower", "id")
    assert_equal "Jane Smith", body.dig("current_loan", "borrower", "name")
  end

  test "an available book's JSON has no current loan" do
    sign_in_as(@owner)
    get book_path(@book, format: :json), as: :json
    assert_response :success
    assert_nil JSON.parse(response.body)["current_loan"]
  end

  test "quick add: the owner creates a name-only member and checks the book out to them" do
    sign_in_as(@owner)
    assert_difference "Borrower.count", 1 do
      post borrowers_path(format: :json),
           params: { borrower: { name: "Neighbour Sam", standing: 100 } }, as: :json
    end
    assert_response :created
    sam = Borrower.find_by(name: "Neighbour Sam")
    assert_nil sam.email

    assert_difference "Loan.count", 1 do
      post checkout_book_borrower_path(sam, format: :json), params: { book_id: @book.id }, as: :json
    end
    assert_response :created
    assert_not @book.reload.available
    assert_equal sam, @book.current_borrower
  end
end
