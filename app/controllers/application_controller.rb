class ApplicationController < ActionController::Base
  include Authentication
  # Only allow modern browsers supporting webp images, web push, badges, import maps, CSS nesting, and CSS :has.
  allow_browser versions: :modern

  # Changes to the importmap will invalidate the etag for HTML responses
  stale_when_importmap_changes

  helper_method :current_user, :owner?

  private

  def current_user
    Current.session&.user
  end

  def owner?
    current_user&.owner? || false
  end

  def require_owner
    return if owner?

    redirect_to root_path, alert: "That part of the library is for the owner only."
  end
end
