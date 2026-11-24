require "test_helper"

class ReadingStatusTbrLimitTest < ActiveSupport::TestCase
  test "the to-be-read list stops at the limit" do
    borrower = Borrower.create!(name: "Collector", email: "collector@example.com", standing: 100)
    ReadingStatus::TBR_LIMIT.times do |i|
      book = Book.create!(title: "Series Book #{i}", author: "Prolific")
      ReadingStatus.create!(borrower: borrower, book: book, status: :want_to_read)
    end

    extra = Book.create!(title: "One Too Many", author: "Prolific")
    status = ReadingStatus.new(borrower: borrower, book: extra, status: :want_to_read)
    assert_not status.valid?
    assert_includes status.errors.full_messages.join(" "), "to-be-read list is full"
  end

  test "the read list has no cap" do
    borrower = Borrower.create!(name: "Finisher", email: "finisher@example.com", standing: 100)
    (ReadingStatus::TBR_LIMIT + 5).times do |i|
      book = Book.create!(title: "Finished #{i}", author: "Prolific")
      ReadingStatus.create!(borrower: borrower, book: book, status: :read)
    end
    assert_equal ReadingStatus::TBR_LIMIT + 5,
                 borrower.reading_statuses.where(status: :read).count
  end
end
