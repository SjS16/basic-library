class ApplicationController < ActionController::Base
  include Authentication
  # Only allow modern browsers supporting webp images, web push, badges, import maps, CSS nesting, and CSS :has.
  allow_browser versions: :modern

  # Changes to the importmap will invalidate the etag for HTML responses
  stale_when_importmap_changes

  helper_method :current_user, :owner?, :current_library

  private

  def current_user
    Current.session&.user
  end

  def owner?
    current_user&.owner? || false
  end

  # Phase 1 of multi-library: there is still exactly one library,
  # and scoped reads run through it. Later phases resolve the
  # library from the signed-in user's ownerships and memberships.
  def current_library
    @current_library ||= BookLibrary.default_library
  end

  def require_owner
    return if owner?

    redirect_to root_path, alert: "That part of the library is for the owner only."
  end

  # Mail must never break the request that triggered it: an SMTP
  # hiccup (or mail simply not being configured yet) shouldn't fail
  # a borrow request, so delivery errors are logged and swallowed.
  def deliver_safely(mail)
    mail.deliver_now
  rescue StandardError => e
    Rails.logger.error("Mail delivery failed: #{e.class}: #{e.message}")
  end
end
