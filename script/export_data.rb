# Exports the local library data to db/data_export.json.
# Run locally against the development database:
#   bin/rails runner script/export_data.rb
require "json"

data = {
  "books" => Book.order(:id).map(&:as_json),
  "borrowers" => Borrower.order(:id).map(&:as_json),
  "loans" => Loan.order(:id).map(&:as_json),
  "reading_statuses" => ReadingStatus.order(:id).map(&:as_json)
}

path = Rails.root.join("db/data_export.json")
File.write(path, JSON.pretty_generate(data))
puts "Wrote #{path}"
puts data.transform_values(&:count).inspect
