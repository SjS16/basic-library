require "test_helper"

class NotificationsTest < ActionDispatch::IntegrationTest
  setup do
    @owner = users(:two)
    @owner.update!(owner: true)
    @member = users(:one)
    @member.update!(borrower: borrowers(:good_borrower))
  end

  test "adding a wished-for book notifies the member who wants it" do
    wished = Book.create!(title: "The Wished Book", author: "Some Author", in_library: false, available: false)
    ReadingStatus.create!(borrower: borrowers(:good_borrower), book: wished, status: :want_to_read)

    sign_in_as(@owner)
    assert_difference -> { Notification.where(user: @member, kind: "wishlist_book_arrived").count }, 1 do
      post books_path(format: :json),
           params: { book: { title: "The Wished Book", author: "Some Author" } }, as: :json
    end
    assert_response :created
    assert wished.reload.in_library?
    assert_equal wished, Notification.where(user: @member, kind: "wishlist_book_arrived").last.book
  end

  test "adding a brand-new book notifies nobody" do
    sign_in_as(@owner)
    assert_no_difference "Notification.count" do
      post books_path(format: :json),
           params: { book: { title: "Unwished", author: "Nobody" } }, as: :json
    end
    assert_response :created
  end

  test "joining through the invite link notifies the owner" do
    joiner = User.create!(name: "New Person", email_address: "newperson@example.com", password: "password")
    sign_in_as(joiner)
    assert_difference -> { Notification.where(user: @owner, kind: "member_joined").count }, 1 do
      post "/invite_link/accept.json", params: { token: InviteLink.current.token }, as: :json
    end
    assert_response :success
    notification = Notification.where(user: @owner, kind: "member_joined").last
    assert_equal "New Person", notification.borrower.name
  end

  test "a member sees and dismisses their own notifications only" do
    note = Notification.create!(user: @member, kind: "wishlist_book_arrived")
    Notification.create!(user: @owner, kind: "member_joined", borrower: borrowers(:good_borrower))

    sign_in_as(@member)
    get notifications_path(format: :json)
    assert_response :success
    ids = JSON.parse(response.body)["notifications"].map { |n| n["id"] }
    assert_equal [ note.id ], ids

    assert_difference "Notification.count", -1 do
      delete notification_path(note, format: :json), as: :json
    end
    assert_response :no_content
  end

  test "a borrow request notifies the owner" do
    book = Book.create!(title: "Wanted Out", author: "Some Author", in_library: true, available: true)

    sign_in_as(@member)
    assert_difference -> { Notification.where(user: @owner, kind: "borrow_request_received").count }, 1 do
      post borrow_requests_path(format: :json),
           params: { borrow_request: { book_id: book.id } }, as: :json
    end
    assert_response :created
    assert_equal book, Notification.where(user: @owner, kind: "borrow_request_received").last.book
  end

  test "approving a borrow request notifies the member who asked" do
    book = Book.create!(title: "Approvable", author: "Some Author", in_library: true, available: true)
    request = BorrowRequest.create!(borrower: borrowers(:good_borrower), book: book)

    sign_in_as(@owner)
    assert_difference -> { Notification.where(user: @member, kind: "borrow_request_approved").count }, 1 do
      post approve_borrow_request_path(request, format: :json), as: :json
    end
    assert_response :success
  end

  test "declining a borrow request notifies the member who asked" do
    book = Book.create!(title: "Declinable", author: "Some Author", in_library: true, available: true)
    request = BorrowRequest.create!(borrower: borrowers(:good_borrower), book: book)

    sign_in_as(@owner)
    assert_difference -> { Notification.where(user: @member, kind: "borrow_request_declined").count }, 1 do
      post decline_borrow_request_path(request, format: :json), as: :json
    end
    assert_response :success
  end
end
