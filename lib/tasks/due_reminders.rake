namespace :loans do
  desc "Send due-date reminder emails (the day before a loan is due, and the day it is due)"
  task send_due_reminders: :environment do
    sent = DueReminders.run
    puts "Sent #{sent} due-date reminder(s)."
  end
end
