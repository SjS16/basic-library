class WishlistBooksController < ApplicationController
  before_action :set_borrower
  before_action :require_borrower_self

  # POST /borrowers/:borrower_id/wishlist_books.json
  # Adds a book to the borrower's to-be-read list even when the library
  # does not own it. Reuses the book record when one already exists for
  # that title + author; otherwise creates it flagged in_library: false.
  def create
    attrs = wishlist_book_params
    book = Book.where("lower(title) = :title AND lower(author) = :author",
                      title: attrs[:title].to_s.strip.downcase,
                      author: attrs[:author].to_s.strip.downcase).first
    book ||= Book.new(attrs.merge(in_library: false, available: false))

    if book.new_record? && !book.save
      return render json: { error: book.errors.full_messages.to_sentence }, status: :unprocessable_entity
    end

    if @borrower.reading_statuses.exists?(book_id: book.id)
      return render json: { error: "\"#{book.title}\" is already on this reading list." }, status: :unprocessable_entity
    end

    reading_status = @borrower.reading_statuses.build(book: book, status: :want_to_read)

    if reading_status.save
      render json: reading_status.as_json(include: :book), status: :created
    else
      render json: { error: reading_status.errors.full_messages.to_sentence }, status: :unprocessable_entity
    end
  end

  private

  def set_borrower
    @borrower = Borrower.find(params[:borrower_id])
  end

  # Adding to a list is the member's own job. The owner's role on a
  # member's page is lending, not list-keeping.
  def require_borrower_self
    return if current_user&.borrower == @borrower

    render json: { error: "Only the member can add books to their own list." }, status: :forbidden
  end

  def wishlist_book_params
    params.require(:book).permit(:title, :author, :genre, :published_year, :description)
  end
end
