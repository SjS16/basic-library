require "test_helper"

class BorrowerDeletionTest < ActionDispatch::IntegrationTest
  setup do
    @owner = users(:two)
    @owner.update!(owner: true)
  end

  test "owner can remove a member with no books out; their account is unlinked, not deleted" do
    record = Borrower.create!(name: "Temp Member", email: "temp@example.com", standing: 100)
    account = User.create!(email_address: "temp@example.com", password: "password", borrower: record)

    sign_in_as(@owner)
    assert_difference "Borrower.count", -1 do
      delete borrower_path(record, format: :json), as: :json
    end
    assert_response :no_content
    assert_nil account.reload.borrower_id
  end

  test "a member with a book still out cannot be removed, and the book stays checked out" do
    borrower = borrowers(:good_borrower) # holds the fixture loan on The Great Gatsby

    sign_in_as(@owner)
    assert_no_difference "Borrower.count" do
      delete borrower_path(borrower, format: :json), as: :json
    end
    assert_response :unprocessable_entity
    assert_includes response.body, "still has"
    # The loan itself is untouched: still open against this member.
    # (The Gatsby fixture book is flagged available despite the loan,
    # a known fixture quirk, so assert on the loan, not the flag.)
    loan = borrower.current_loans.first
    assert loan.present?
    assert_nil loan.returned_at
  end

  test "a non-owner cannot remove members" do
    member = users(:one)
    member.update!(borrower: borrowers(:good_borrower))
    record = Borrower.create!(name: "Another Member", email: "another@example.com", standing: 100)

    sign_in_as(member)
    assert_no_difference "Borrower.count" do
      delete borrower_path(record, format: :json), as: :json
    end
  end
end
