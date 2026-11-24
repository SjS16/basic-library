class TitleRequestsController < ApplicationController
  # POST /borrowers/:borrower_id/title_requests.json — a member asks
  # for a book by title and author, from the Requests page form.
  #
  # If a library they can access owns the book, this becomes a
  # normal borrow request (and the owner is notified). If nobody
  # owns it, the ask lands on their want-to-read list as a wish
  # instead of dead-ending; if the owner ever adds the book, their
  # entry points at the real copy automatically.
  def create
    borrower = Borrower.find(params[:borrower_id])
    unless current_user&.borrower == borrower
      return render json: { error: "You can only request books for yourself." }, status: :forbidden
    end

    title = params.dig(:book, :title).to_s.strip
    author = params.dig(:book, :author).to_s.strip
    isbn = params.dig(:book, :isbn).to_s.strip
    if title.blank? || author.blank?
      return render json: { error: "A title and an author are both needed." }, status: :unprocessable_entity
    end

    book = find_book(Book.in_library, isbn, title, author)
    return request_the_book(borrower, book) if book

    wish_for_the_book(borrower, title, author, isbn)
  end

  private

  # An ISBN carried from Open Library is the strong match (it
  # sidesteps author spellings entirely); title + author is the
  # fallback for hand-typed asks.
  def find_book(scope, isbn, title, author)
    if isbn.present?
      match = scope.where(isbn: isbn).first
      return match if match
    end
    scope.where("lower(title) = :t AND lower(author) = :a", t: title.downcase, a: author.downcase).first
  end

  def request_the_book(borrower, book)
    request = borrower.borrow_requests.build(book: book)
    if request.save
      deliver_safely LibraryMailer.borrow_request_received(request)
      Notification.borrow_request_received!(request)
      render json: { outcome: "requested", book: book_json(book) }, status: :created
    else
      render json: { error: request.errors.full_messages.to_sentence }, status: :unprocessable_entity
    end
  end

  def wish_for_the_book(borrower, title, author, isbn)
    book = find_book(Book.all, isbn, title, author)
    book ||= Book.new(title: title, author: author, isbn: isbn.presence, in_library: false, available: false)
    unless book.save
      return render json: { error: book.errors.full_messages.to_sentence }, status: :unprocessable_entity
    end

    status = borrower.reading_statuses.find_or_initialize_by(book: book)
    if status.persisted?
      render json: { outcome: "already_on_list", book: book_json(book) }
    else
      status.status = :want_to_read
      if status.save
        render json: { outcome: "wishlisted", book: book_json(book) }, status: :created
      else
        render json: { error: status.errors.full_messages.to_sentence }, status: :unprocessable_entity
      end
    end
  end

  def book_json(book)
    { id: book.id, title: book.title, author: book.author, available: book.available, in_library: book.in_library }
  end
end
