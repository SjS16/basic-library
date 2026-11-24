class RecommendationsController < ApplicationController
  before_action :set_recommendation, only: [ :accept, :decline ]
  before_action :require_recipient, only: [ :accept, :decline ]

  # GET /recommendations — HTML loads the React app; JSON returns
  # the signed-in member's pending recommendations (received) and
  # everything they have sent, with its outcome.
  def index
    respond_to do |format|
      format.html { render template: "home/index" }
      format.json do
        borrower = current_user&.borrower
        received = if borrower
                     borrower.recommendations_received.pending.includes(:book, :recommender).recent_first
        else
                     Recommendation.none
        end
        sent = if borrower
                 borrower.recommendations_sent.includes(:book, :recipient).recent_first
        else
                 Recommendation.none
        end
        render json: {
          recommendations: received.map { |r| recommendation_json(r) },
          sent: sent.map { |r| recommendation_json(r) }
        }
      end
    end
  end

  # GET /recommendations/recipients.json — who the signed-in member
  # can recommend a book to: every other member, by name.
  def recipients
    borrower = current_user&.borrower
    unless borrower
      return render json: { error: "Your account is not linked to a member record." }, status: :forbidden
    end

    others = Borrower.where.not(id: borrower.id).order(:name)
    render json: { recipients: others.map { |b| { id: b.id, name: b.name } } }
  end

  # POST /recommendations.json — a member recommends a book to
  # another member. The book is a title, not a copy: it is matched
  # against the whole collection (ISBN first, then title + author)
  # and created as a wishlist record when nobody owns it yet, so
  # accepting it later plugs into the usual wish machinery.
  def create
    recommender = current_user&.borrower
    unless recommender
      return render json: { error: "Your account is not linked to a member record." }, status: :forbidden
    end

    recipient = Borrower.find_by(id: params.dig(:recommendation, :recipient_id))
    unless recipient
      return render json: { error: "Pick someone to recommend this book to." }, status: :unprocessable_entity
    end
    if recipient == recommender
      return render json: { error: "You cannot recommend a book to yourself." }, status: :unprocessable_entity
    end

    book = resolve_book
    unless book
      return render json: { error: @resolve_error || "That book could not be found." }, status: :unprocessable_entity
    end

    if recipient.reading_statuses.exists?(book_id: book.id)
      return render json: { error: "#{recipient.name} already has this book on their reading list." }, status: :unprocessable_entity
    end
    if recipient.current_loans.exists?(book_id: book.id)
      return render json: { error: "#{recipient.name} has this book checked out right now." }, status: :unprocessable_entity
    end

    @recommendation = Recommendation.new(
      recommender: recommender, recipient: recipient, book: book,
      note: params.dig(:recommendation, :note).to_s.strip.presence
    )
    if @recommendation.save
      Notification.book_recommended!(@recommendation)
      render json: recommendation_json(@recommendation), status: :created
    else
      render json: { error: @recommendation.errors.full_messages.to_sentence }, status: :unprocessable_entity
    end
  end

  # POST /recommendations/:id/accept — the recipient puts the book
  # on their to-be-read list. The list cap applies, so a full list
  # is a polite refusal with the reason, not a silent failure.
  def accept
    unless @recommendation.pending?
      return render json: { error: "This recommendation has already been decided." }, status: :unprocessable_entity
    end

    entry = @recommendation.recipient.reading_statuses.find_or_initialize_by(book: @recommendation.book)
    if entry.persisted?
      @recommendation.update!(status: :accepted)
      Notification.recommendation_accepted!(@recommendation)
      return render json: recommendation_json(@recommendation).merge(outcome: "already_on_list")
    end

    entry.status = :want_to_read
    if entry.save
      @recommendation.update!(status: :accepted)
      Notification.recommendation_accepted!(@recommendation)
      render json: recommendation_json(@recommendation).merge(outcome: "added")
    else
      render json: { error: entry.errors.full_messages.to_sentence }, status: :unprocessable_entity
    end
  end

  # POST /recommendations/:id/decline — the recipient passes.
  def decline
    unless @recommendation.pending?
      return render json: { error: "This recommendation has already been decided." }, status: :unprocessable_entity
    end

    @recommendation.update!(status: :declined)
    render json: recommendation_json(@recommendation)
  end

  private

  def set_recommendation
    @recommendation = Recommendation.find(params[:id])
  end

  def require_recipient
    return if current_user&.borrower == @recommendation.recipient

    render json: { error: "Only the person it was recommended to can decide on it." }, status: :forbidden
  end

  # The book-page door passes a record id; the search door passes
  # title and author, plus ISBN and cover when the pick came from
  # Open Library. Matching mirrors the title-request flow.
  def resolve_book
    if params.dig(:book, :id).present?
      book = Book.find_by(id: params.dig(:book, :id))
      @resolve_error = "That book could not be found." unless book
      return book
    end

    title = params.dig(:book, :title).to_s.strip
    author = params.dig(:book, :author).to_s.strip
    isbn = params.dig(:book, :isbn).to_s.strip
    if title.blank? || author.blank?
      @resolve_error = "A title and an author are both needed."
      return nil
    end

    book = find_book(isbn, title, author)
    return book if book

    book = Book.new(title: title, author: author, isbn: isbn.presence,
                    cover_url: params.dig(:book, :cover_url).to_s.strip.presence,
                    in_library: false, available: false)
    unless book.save
      @resolve_error = book.errors.full_messages.to_sentence
      return nil
    end
    book
  end

  def find_book(isbn, title, author)
    if isbn.present?
      match = Book.where(isbn: isbn).first
      return match if match
    end
    Book.where("lower(title) = :t AND lower(author) = :a", t: title.downcase, a: author.downcase).first
  end

  def recommendation_json(recommendation)
    {
      id: recommendation.id,
      note: recommendation.note,
      status: recommendation.status,
      created_at: recommendation.created_at,
      recommender: { id: recommendation.recommender.id, name: recommendation.recommender.name },
      recipient: { id: recommendation.recipient.id, name: recommendation.recipient.name },
      book: {
        id: recommendation.book.id, title: recommendation.book.title,
        author: recommendation.book.author, cover_url: recommendation.book.cover_url,
        in_library: recommendation.book.in_library, available: recommendation.book.available
      }
    }
  end
end
