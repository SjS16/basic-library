class MembershipRequestsController < ApplicationController
  before_action :set_membership_request, only: [ :approve, :decline ]
  before_action :require_owner, only: [ :approve, :decline ]

  # GET /membership_requests — HTML loads the React app; JSON feeds it.
  # The owner sees everyone's join requests; an account sees its own.
  def index
    respond_to do |format|
      format.html { render template: "home/index" }
      format.json do
        requests = if owner?
                     MembershipRequest.includes(:user).recent_first
                   else
                     current_user.membership_requests.recent_first
                   end
        render json: { membership_requests: requests.map { |request| request_json(request) } }
      end
    end
  end

  # POST /membership_requests.json — a signed-in account asks to join.
  def create
    @membership_request = current_user.membership_requests.build

    if @membership_request.save
      deliver_safely LibraryMailer.membership_request_received(@membership_request)
      render json: request_json(@membership_request), status: :created
    else
      render json: { error: @membership_request.errors.full_messages.to_sentence }, status: :unprocessable_entity
    end
  end

  # POST /membership_requests/:id/approve — owner only. Grants
  # membership: creates/links the member record for that account.
  def approve
    unless @membership_request.pending?
      return render json: { error: "This request is no longer pending." }, status: :unprocessable_entity
    end

    @membership_request.user.activate_membership!
    @membership_request.update!(status: :approved)
    render json: request_json(@membership_request)
  end

  # POST /membership_requests/:id/decline — owner only.
  def decline
    unless @membership_request.pending?
      return render json: { error: "This request is no longer pending." }, status: :unprocessable_entity
    end

    @membership_request.update!(status: :declined)
    render json: request_json(@membership_request)
  end

  private

  def set_membership_request
    @membership_request = MembershipRequest.find(params[:id])
  end

  def request_json(request)
    request.as_json(include: { user: { only: [ :id, :name, :email_address ] } })
  end
end
