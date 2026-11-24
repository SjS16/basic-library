class RegistrationsController < ApplicationController
  allow_unauthenticated_access only: %i[ new create ]
  rate_limit to: 10, within: 3.minutes, only: :create, with: -> { redirect_to new_registration_url, alert: "Try again later." }

  def new
    # A signed-in account following an invite link joins on the spot.
    if current_user && InviteLink.valid_token?(params[:invite])
      current_user.activate_membership!(notify_owner: true)
      redirect_to root_path, notice: "You have been added to the library. Welcome!"
      return
    end

    @user = User.new
  end

  def create
    @user = User.new(user_params)

    if @user.save
      # Signing up through the owner's invite link grants membership
      # immediately; without it, membership is granted separately.
      @user.activate_membership!(notify_owner: true) if InviteLink.valid_token?(params[:invite_token])
      start_new_session_for(@user)
      redirect_to root_path, notice: "Welcome! Your account is ready."
    else
      render :new, status: :unprocessable_entity
    end
  end

  private

  def user_params
    params.require(:user).permit(:name, :email_address, :password, :password_confirmation)
  end
end
