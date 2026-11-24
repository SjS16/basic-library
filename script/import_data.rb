# Imports db/data_export.json into an EMPTY database, preserving ids so
# loans and reading statuses keep pointing at the right books and borrowers.
# Skips all model callbacks and validations on purpose: the exported rows
# already carry their final state (including books.available).
# Safe to run more than once: it refuses to run if any data already exists.
# Run with: bin/rails runner script/import_data.rb
require "json"

path = Rails.root.join("db/data_export.json")
abort "No export file found at #{path}" unless File.exist?(path)

if Book.exists? || Borrower.exists?
  puts "Database already has data; skipping import."
  exit
end

data = JSON.parse(File.read(path))

ActiveRecord::Base.transaction do
  Borrower.insert_all!(data["borrowers"]) if data["borrowers"].any?
  Book.insert_all!(data["books"]) if data["books"].any?
  Loan.insert_all!(data["loans"]) if data["loans"].any?
  ReadingStatus.insert_all!(data["reading_statuses"]) if data["reading_statuses"].any?
end

%w[books borrowers loans reading_statuses].each do |table|
  ActiveRecord::Base.connection.reset_pk_sequence!(table)
end

puts "Imported: #{data.transform_values(&:count).inspect}"
