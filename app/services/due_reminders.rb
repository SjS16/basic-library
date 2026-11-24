# Sends the automated due-date reminders: one email the day before
# a loan is due, one on the day itself. Each loan is stamped when
# its reminder goes out, so running this more than once a day is
# harmless. Triggered by the loans:send_due_reminders rake task, or
# by the token-protected endpoint an external scheduler pings.
class DueReminders
  def self.run
    new.run
  end

  def run
    sent = 0
    Loan.active.includes(:book, :borrower).find_each do |loan|
      if loan.due_today_reminder_sent_at.nil? && loan.due_date.to_date == Date.current
        sent += 1 if deliver_and_stamp(loan, :due_today, :due_today_reminder_sent_at)
      elsif loan.due_soon_reminder_sent_at.nil? && loan.due_date.to_date == Date.tomorrow
        sent += 1 if deliver_and_stamp(loan, :due_tomorrow, :due_soon_reminder_sent_at)
      end
    end
    sent
  end

  private

  def deliver_and_stamp(loan, mailer_action, stamp_column)
    LibraryMailer.public_send(mailer_action, loan).deliver_now
    loan.update!(stamp_column => Time.current)
    true
  rescue StandardError => e
    Rails.logger.error("Due reminder failed for loan #{loan.id}: #{e.class}: #{e.message}")
    false
  end
end
