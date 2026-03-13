require "test_helper"

class ReadingStatusesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @borrower = borrowers(:good_borrower)
    @book = books(:available_book)
    @reading_status = reading_statuses(:want_to_read)
  end

  test "should create reading status" do
    new_book = books(:another_available_book)

    assert_difference("ReadingStatus.count") do
      post borrower_reading_statuses_url(@borrower), params: {
        reading_status: {
          book_id: new_book.id,
          status: "want_to_read"
        }
      }, as: :json
    end

    assert_response :created
    json_response = JSON.parse(response.body)
    assert_equal "want_to_read", json_response["status"]
  end

  test "should not create duplicate reading status" do
    post borrower_reading_statuses_url(@borrower), params: {
      reading_status: {
        book_id: @book.id,
        status: "currently_reading"
      }
    }, as: :json

    assert_response :unprocessable_entity
  end

  test "should update reading status" do
    patch borrower_reading_status_url(@borrower, @reading_status), params: {
      reading_status: {
        status: "read",
        rating: 5,
        notes: "Great book!"
      }
    }, as: :json

    assert_response :success
    @reading_status.reload
    assert_equal "read", @reading_status.status
    assert_equal 5, @reading_status.rating
  end

  test "should destroy reading status" do
    assert_difference("ReadingStatus.count", -1) do
      delete borrower_reading_status_url(@borrower, @reading_status), as: :json
    end

    assert_response :no_content
  end
end
