class BorrowRequestsController < ApplicationController
  before_action :set_borrow_request, only: [ :approve, :decline, :cancel ]
  before_action :require_owner, only: [ :approve, :decline ]

  # GET /borrow_requests — HTML loads the React app; JSON feeds it.
  # The owner sees every request (this is their notification queue);
  # a member sees only their own.
  def index
    respond_to do |format|
      format.html { render template: "home/index" }
      format.json do
        requests = if owner?
                     BorrowRequest.includes(:borrower, :book).recent_first
        elsif current_user&.borrower
                     current_user.borrower.borrow_requests.includes(:book).recent_first
        else
                     BorrowRequest.none
        end
        render json: { borrow_requests: requests.map { |request| request_json(request) } }
      end
    end
  end

  # POST /borrow_requests.json — a member asks to borrow a book.
  def create
    borrower = current_user&.borrower
    unless borrower
      return render json: { error: "Your account is not linked to a member record." }, status: :forbidden
    end

    @borrow_request = borrower.borrow_requests.build(borrow_request_params)

    if @borrow_request.save
      deliver_safely LibraryMailer.borrow_request_received(@borrow_request)
      Notification.borrow_request_received!(@borrow_request)
      render json: request_json(@borrow_request), status: :created
    else
      render json: { error: @borrow_request.errors.full_messages.to_sentence }, status: :unprocessable_entity
    end
  end

  # POST /borrow_requests/:id/approve — owner only. Lends the book:
  # approving creates the loan, with all the usual loan rules.
  def approve
    unless @borrow_request.pending?
      return render json: { error: "This request is no longer pending." }, status: :unprocessable_entity
    end

    loan = @borrow_request.borrower.loans.build(
      book: @borrow_request.book,
      checked_out_at: Time.current,
      due_date: 2.weeks.from_now
    )

    if loan.save
      @borrow_request.update!(status: :approved)
      Notification.borrow_request_decided!(@borrow_request)
      render json: request_json(@borrow_request)
    else
      render json: { error: loan.errors.full_messages.to_sentence }, status: :unprocessable_entity
    end
  end

  # POST /borrow_requests/:id/decline — owner only.
  def decline
    unless @borrow_request.pending?
      return render json: { error: "This request is no longer pending." }, status: :unprocessable_entity
    end

    @borrow_request.update!(status: :declined)
    Notification.borrow_request_decided!(@borrow_request)
    render json: request_json(@borrow_request)
  end

  # POST /borrow_requests/:id/cancel — the requesting member (or owner).
  def cancel
    unless owner? || current_user&.borrower == @borrow_request.borrower
      return render json: { error: "You can only cancel your own requests." }, status: :forbidden
    end
    unless @borrow_request.pending?
      return render json: { error: "This request is no longer pending." }, status: :unprocessable_entity
    end

    @borrow_request.update!(status: :cancelled)
    render json: request_json(@borrow_request)
  end

  private

  def set_borrow_request
    @borrow_request = BorrowRequest.find(params[:id])
  end

  def borrow_request_params
    params.require(:borrow_request).permit(:book_id)
  end

  def request_json(request)
    request.as_json(include: {
      borrower: { only: [ :id, :name ] },
      book: { only: [ :id, :title, :author, :available, :in_library ] }
    })
  end
end
