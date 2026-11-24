require "test_helper"

class RecommendationsTest < ActionDispatch::IntegrationTest
  setup do
    @recommender_user = users(:one)
    @recommender_user.update!(borrower: borrowers(:good_borrower))
    @recipient_user = User.create!(name: "John Doe", email_address: "john-recipient@example.com", password: "password")
    @recipient_user.update!(borrower: borrowers(:excellent_borrower))
    @recipient = borrowers(:excellent_borrower)
  end

  test "recommending a book nobody owns creates a pending recommendation, a wishlist record, and a notification" do
    sign_in_as(@recommender_user)
    assert_difference "Recommendation.count", 1 do
      assert_difference -> { Notification.where(user: @recipient_user, kind: "book_recommended").count }, 1 do
        post recommendations_path(format: :json),
             params: { recommendation: { recipient_id: @recipient.id, note: "You would love this." },
                       book: { title: "A Faraway Book", author: "Distant Author", isbn: "9780000000001" } }, as: :json
      end
    end
    assert_response :created

    recommendation = Recommendation.last
    assert recommendation.pending?
    assert_equal borrowers(:good_borrower), recommendation.recommender
    assert_equal "You would love this.", recommendation.note
    assert_not recommendation.book.in_library?
  end

  test "recommending a book already in the library points at the real copy" do
    book = Book.create!(title: "On The Shelves", author: "Some Author", in_library: true, available: true)

    sign_in_as(@recommender_user)
    assert_no_difference "Book.count" do
      post recommendations_path(format: :json),
           params: { recommendation: { recipient_id: @recipient.id }, book: { id: book.id } }, as: :json
    end
    assert_response :created
    assert_equal book, Recommendation.last.book
  end

  test "the same pending recommendation cannot be sent twice" do
    sign_in_as(@recommender_user)
    payload = { recommendation: { recipient_id: @recipient.id },
                book: { title: "Twice Is Too Much", author: "Some Author" } }
    post recommendations_path(format: :json), params: payload, as: :json
    assert_response :created

    assert_no_difference "Recommendation.count" do
      post recommendations_path(format: :json), params: payload, as: :json
    end
    assert_response :unprocessable_entity
  end

  test "accepting a recommendation puts the book on the recipient's to-be-read list" do
    recommendation = Recommendation.create!(
      recommender: borrowers(:good_borrower), recipient: @recipient,
      book: Book.create!(title: "Accept Me", author: "Some Author", in_library: false, available: false)
    )

    sign_in_as(@recipient_user)
    assert_difference -> { @recipient.reading_statuses.where(status: :want_to_read).count }, 1 do
      post accept_recommendation_path(recommendation, format: :json), as: :json
    end
    assert_response :success
    assert recommendation.reload.accepted?
  end

  test "accepting is refused politely when the to-be-read list is full" do
    existing = @recipient.reading_statuses.where(status: :want_to_read).count
    (ReadingStatus::TBR_LIMIT - existing).times do |i|
      book = Book.create!(title: "Filler #{i}", author: "Some Author", in_library: false, available: false)
      ReadingStatus.create!(borrower: @recipient, book: book, status: :want_to_read)
    end
    recommendation = Recommendation.create!(
      recommender: borrowers(:good_borrower), recipient: @recipient,
      book: Book.create!(title: "One Too Many", author: "Some Author", in_library: false, available: false)
    )

    sign_in_as(@recipient_user)
    assert_no_difference "ReadingStatus.count" do
      post accept_recommendation_path(recommendation, format: :json), as: :json
    end
    assert_response :unprocessable_entity
    assert_includes response.body, "full"
    assert recommendation.reload.pending?
  end

  test "declining a recommendation adds nothing, and only the recipient can decide" do
    recommendation = Recommendation.create!(
      recommender: borrowers(:good_borrower), recipient: @recipient,
      book: Book.create!(title: "Decline Me", author: "Some Author", in_library: false, available: false)
    )

    sign_in_as(@recommender_user)
    post decline_recommendation_path(recommendation, format: :json), as: :json
    assert_response :forbidden
    assert recommendation.reload.pending?

    sign_in_as(@recipient_user)
    assert_no_difference "ReadingStatus.count" do
      post decline_recommendation_path(recommendation, format: :json), as: :json
    end
    assert_response :success
    assert recommendation.reload.declined?
  end
end
