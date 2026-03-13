# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_03_13_203624) do
  create_table "books", force: :cascade do |t|
    t.string "author"
    t.boolean "available"
    t.text "cover_url"
    t.datetime "created_at", null: false
    t.text "description"
    t.string "genre"
    t.integer "published_year"
    t.integer "rating"
    t.string "title"
    t.datetime "updated_at", null: false
  end

  create_table "borrowers", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email"
    t.string "name", null: false
    t.integer "standing", default: 100, null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_borrowers_on_email", unique: true
  end

  create_table "loans", force: :cascade do |t|
    t.integer "book_id", null: false
    t.integer "borrower_id", null: false
    t.datetime "checked_out_at", null: false
    t.datetime "created_at", null: false
    t.datetime "due_date", null: false
    t.datetime "returned_at"
    t.datetime "updated_at", null: false
    t.index ["book_id", "returned_at"], name: "index_loans_on_book_id_and_returned_at"
    t.index ["book_id"], name: "index_loans_on_book_id"
    t.index ["borrower_id", "returned_at"], name: "index_loans_on_borrower_id_and_returned_at"
    t.index ["borrower_id"], name: "index_loans_on_borrower_id"
  end

  create_table "reading_statuses", force: :cascade do |t|
    t.integer "book_id", null: false
    t.integer "borrower_id", null: false
    t.datetime "created_at", null: false
    t.text "notes"
    t.integer "rating"
    t.integer "status", default: 0, null: false
    t.datetime "updated_at", null: false
    t.index ["book_id"], name: "index_reading_statuses_on_book_id"
    t.index ["borrower_id", "book_id"], name: "index_reading_statuses_on_borrower_id_and_book_id", unique: true
    t.index ["borrower_id"], name: "index_reading_statuses_on_borrower_id"
  end

  add_foreign_key "loans", "books"
  add_foreign_key "loans", "borrowers"
  add_foreign_key "reading_statuses", "books"
  add_foreign_key "reading_statuses", "borrowers"
end
