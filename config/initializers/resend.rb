# Resend's HTTPS API is the production mail transport: Render's
# free tier blocks outbound SMTP ports, so the SMTP settings can
# only ever time out there. The key is the same Resend API key the
# SMTP settings used as their password, so fall back to it when a
# dedicated RESEND_API_KEY has not been set.
if ENV["RESEND_API_KEY"].present? || ENV["SMTP_PASSWORD"].present?
  Resend.api_key = ENV["RESEND_API_KEY"].presence || ENV["SMTP_PASSWORD"]
end
