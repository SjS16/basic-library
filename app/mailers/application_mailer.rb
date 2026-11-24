class ApplicationMailer < ActionMailer::Base
  default from: ENV.fetch("MAIL_FROM", "My Library <library@example.com>")
  layout "mailer"
end
