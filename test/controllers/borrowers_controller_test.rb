require "test_helper"

class BorrowersControllerTest < ActionDispatch::IntegrationTest
  setup do
    @borrower = borrowers(:excellent_borrower)
    @book = books(:available_book)
  end

  test "should get index" do
    get borrowers_url
    assert_response :success
  end

  test "should get index as json" do
    get borrowers_url, as: :json
    assert_response :success
    json_response = JSON.parse(response.body)
    assert_kind_of Array, json_response
  end

  test "should show borrower" do
    get borrower_url(@borrower)
    assert_response :success
  end

  test "should show borrower as json with reading statuses" do
    get borrower_url(@borrower), as: :json
    assert_response :success
    
    json_response = JSON.parse(response.body)
    assert json_response.key?("reading_statuses")
    assert json_response.key?("current_loans")
    assert json_response.key?("standing")
  end

  test "should create borrower" do
    assert_difference("Borrower.count") do
      post borrowers_url, params: { 
        borrower: { 
          name: "New Borrower", 
          email: "new@example.com" 
        } 
      }, as: :json
    end
    assert_response :created
  end

  test "should update borrower" do
    patch borrower_url(@borrower), params: { 
      borrower: { name: "Updated Name" } 
    }, as: :json
    
    assert_response :success
    @borrower.reload
    assert_equal "Updated Name", @borrower.name
  end

  test "should checkout book" do
    @book.update(available: true)
    
    post checkout_book_borrower_url(@borrower), params: { 
      book_id: @book.id 
    }, as: :json
    
    assert_response :success
    @book.reload
    refute @book.available
  end

  test "should not checkout book when standing too low" do
    @borrower.update(standing: 30)
    @book.update(available: true)
    
    post checkout_book_borrower_url(@borrower), params: { 
      book_id: @book.id 
    }, as: :json
    
    assert_response :unprocessable_entity
  end

  test "should return book" do
    loan = @borrower.loans.create!(
      book: @book,
      checked_out_at: Time.current,
      due_date: 14.days.from_now
    )
    @book.update(available: false)
    
    post return_book_borrower_url(@borrower), params: { 
      book_id: @book.id 
    }, as: :json
    
    assert_response :success
    @book.reload
    assert @book.available
    loan.reload
    assert_not_nil loan.returned_at
  end

  test "should destroy borrower" do
    borrower = Borrower.create!(name: "To Delete", email: "delete@example.com")
    
    assert_difference("Borrower.count", -1) do
      delete borrower_url(borrower), as: :json
    end
    assert_response :no_content
  end
end
