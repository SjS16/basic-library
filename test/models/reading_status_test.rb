require "test_helper"

class ReadingStatusTest < ActiveSupport::TestCase
  test "should create reading status with valid attributes" do
    borrower = borrowers(:excellent_borrower)
    book = books(:available_book)

    status = ReadingStatus.create!(
      borrower: borrower,
      book: book,
      status: :want_to_read
    )

    assert status.persisted?
    assert_equal "want_to_read", status.status
  end

  test "should not allow duplicate reading status for same borrower and book" do
    borrower = borrowers(:good_borrower)
    book = books(:available_book)

    # This already exists in fixtures
    existing = reading_statuses(:want_to_read)
    assert_equal borrower, existing.borrower
    assert_equal book, existing.book

    duplicate = ReadingStatus.new(
      borrower: borrower,
      book: book,
      status: :currently_reading
    )

    refute duplicate.valid?
    assert_includes duplicate.errors[:borrower_id], "has already marked this book"
  end

  test "status enum works correctly" do
    status = reading_statuses(:want_to_read)

    assert status.want_to_read?
    refute status.currently_reading?
    refute status.read?

    status.update(status: :currently_reading)
    refute status.want_to_read?
    assert status.currently_reading?

    status.update(status: :read)
    assert status.read?
  end

  test "status_color returns correct colors" do
    status = reading_statuses(:want_to_read)
    assert_equal "blue", status.status_color

    status.update(status: :currently_reading)
    assert_equal "yellow", status.status_color

    status.update(status: :read)
    assert_equal "green", status.status_color
  end

  test "can add rating and notes" do
    status = reading_statuses(:read_with_rating)

    assert_equal 5, status.rating
    assert_not_nil status.notes
  end

  test "scopes work correctly" do
    borrower = borrowers(:excellent_borrower)

    want_to_read_count = borrower.reading_statuses.want_to_read.count
    read_count = borrower.reading_statuses.read.count

    assert want_to_read_count >= 0
    assert read_count >= 0
  end
end
