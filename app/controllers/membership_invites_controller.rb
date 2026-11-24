class MembershipInvitesController < ApplicationController
  before_action :set_invite, only: [ :accept, :decline ]
  before_action :require_owner, only: [ :create ]

  # GET /membership_invites — HTML loads the React app; JSON feeds it.
  # The owner sees the invites they have sent; an account sees the
  # invites addressed to it.
  def index
    respond_to do |format|
      format.html { render template: "home/index" }
      format.json do
        invites = if owner?
                    MembershipInvite.includes(:user).recent_first
        else
                    current_user.membership_invites.recent_first
        end
        render json: { membership_invites: invites.map { |invite| invite_json(invite) } }
      end
    end
  end

  # POST /membership_invites.json — owner only. Invites an existing
  # account, found by email. People without an account need the
  # invite link instead.
  def create
    email = params[:email].to_s.strip.downcase
    user = User.find_by(email_address: email)

    if user.nil?
      return render json: { error: "No account uses that email yet. Send them the invite link instead; they will be added when they sign up." }, status: :unprocessable_entity
    end
    if user.borrower_id.present?
      return render json: { error: "#{email} is already a member of this library." }, status: :unprocessable_entity
    end

    invite = user.membership_invites.build

    if invite.save
      render json: invite_json(invite), status: :created
    else
      render json: { error: invite.errors.full_messages.to_sentence }, status: :unprocessable_entity
    end
  end

  # POST /membership_invites/:id/accept — the invitee joins the library.
  def accept
    return render json: { error: "This invite belongs to another account." }, status: :forbidden unless @invite.user == current_user
    return render json: { error: "This invite is no longer open." }, status: :unprocessable_entity unless @invite.pending?

    current_user.activate_membership!(notify_owner: true)
    @invite.update!(status: :accepted)
    render json: invite_json(@invite)
  end

  # POST /membership_invites/:id/decline — the invitee passes.
  def decline
    return render json: { error: "This invite belongs to another account." }, status: :forbidden unless @invite.user == current_user
    return render json: { error: "This invite is no longer open." }, status: :unprocessable_entity unless @invite.pending?

    @invite.update!(status: :declined)
    render json: invite_json(@invite)
  end

  private

  def set_invite
    @invite = MembershipInvite.find(params[:id])
  end

  def invite_json(invite)
    invite.as_json(include: { user: { only: [ :id, :name, :email_address ] } })
  end
end
