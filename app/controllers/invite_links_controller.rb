class InviteLinksController < ApplicationController
  before_action :require_owner, only: [ :show, :regenerate ]

  # GET /invite_link.json — owner only: the token for the shareable
  # signup link (the React app builds the full URL from it).
  def show
    render json: { token: InviteLink.current.token }
  end

  # POST /invite_link/regenerate.json — owner only. The old link
  # stops working everywhere it was shared.
  def regenerate
    link = InviteLink.current
    link.regenerate!
    render json: { token: link.token }
  end

  # POST /invite_link/accept.json — a signed-in account that followed
  # the link joins the library immediately.
  def accept
    unless InviteLink.valid_token?(params[:token])
      return render json: { error: "That invite link is no longer valid. Ask the owner for a fresh one." }, status: :unprocessable_entity
    end

    current_user.activate_membership!(notify_owner: true)
    render json: { borrower_id: current_user.borrower_id }
  end
end
