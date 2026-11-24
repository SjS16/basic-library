require "test_helper"

class LoanManagementTest < ActionDispatch::IntegrationTest
  setup do
    @owner = users(:two)
    @owner.update!(owner: true)
    @borrower = borrowers(:good_borrower)
    @book = Book.create!(title: "Loanable Book", author: "Some Author", available: true)
    @loan = Loan.create!(borrower: @borrower, book: @book, checked_out_at: 3.weeks.ago, due_date: 1.week.ago)
  end

  test "owner can move a due date, and the reminder stamps reset" do
    @loan.update!(due_soon_reminder_sent_at: 2.days.ago, due_today_reminder_sent_at: 1.day.ago)
    sign_in_as(@owner)

    patch "/loans/#{@loan.id}.json", params: { loan: { due_date: "2027-01-15" } }, as: :json

    assert_response :success
    @loan.reload
    assert_equal Date.new(2027, 1, 15), @loan.due_date.to_date
    assert_nil @loan.due_soon_reminder_sent_at
    assert_nil @loan.due_today_reminder_sent_at
  end

  test "a member cannot move a due date" do
    member = User.create!(email_address: "loan-member@example.com", password: "password", borrower: @borrower)
    sign_in_as(member)

    patch "/loans/#{@loan.id}.json", params: { loan: { due_date: "2027-01-15" } }, as: :json

    assert_response :redirect
    assert_not_equal Date.new(2027, 1, 15), @loan.reload.due_date.to_date
  end

  test "bother sends for a member with an email, and refuses one without" do
    sign_in_as(@owner)

    post "/loans/#{@loan.id}/bother.json", as: :json
    assert_response :success

    no_email = Borrower.create!(name: "Name Only", standing: 100)
    book2 = Book.create!(title: "Another Book", author: "Some Author", available: true)
    loan2 = Loan.create!(borrower: no_email, book: book2, checked_out_at: 3.weeks.ago, due_date: 1.week.ago)

    post "/loans/#{loan2.id}/bother.json", as: :json
    assert_response :unprocessable_entity
  end
end
