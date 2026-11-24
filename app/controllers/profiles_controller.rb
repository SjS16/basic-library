class ProfilesController < ApplicationController
  # GET /profile: the profile page is part of the React app, so this
  # renders the app shell and React Router takes it from there.
  def show
    render template: "home/index"
  end

  # PATCH /profile: change password (requires the current one).
  # Called by the React profile page as JSON; HTML fallback redirects.
  def update
    @user = current_user

    unless @user.authenticate(params[:current_password].to_s)
      respond_to do |format|
        format.json { render json: { alert: "Your current password was not correct." }, status: :unprocessable_entity }
        format.html { redirect_to profile_path, alert: "Your current password was not correct." }
      end
      return
    end

    if @user.update(password_params)
      # Keep this session; sign the user out everywhere else.
      @user.sessions.where.not(id: Current.session.id).destroy_all
      respond_to do |format|
        format.json { render json: { notice: "Password updated." } }
        format.html { redirect_to profile_path, notice: "Password updated." }
      end
    else
      respond_to do |format|
        format.json { render json: { alert: @user.errors.full_messages.to_sentence }, status: :unprocessable_entity }
        format.html { redirect_to profile_path, alert: @user.errors.full_messages.to_sentence }
      end
    end
  end

  private

  def password_params
    params.permit(:password, :password_confirmation)
  end
end
