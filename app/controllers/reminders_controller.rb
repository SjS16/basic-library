class RemindersController < ApplicationController
  allow_unauthenticated_access only: :run
  skip_before_action :verify_authenticity_token, only: :run

  # POST /internal/due_reminders?token=... — pinged once a day by an
  # external scheduler (Render's free tier has no cron). The token
  # lives only in the REMINDER_TOKEN env var; without a match this
  # is just a 404.
  def run
    expected = ENV["REMINDER_TOKEN"].presence
    unless expected && params[:token].present? &&
           ActiveSupport::SecurityUtils.secure_compare(params[:token].to_s, expected)
      return head :not_found
    end

    render json: { sent: DueReminders.run }
  end
end
