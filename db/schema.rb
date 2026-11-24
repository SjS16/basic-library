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

ActiveRecord::Schema[8.1].define(version: 2026_11_25_000011) do
  create_table "books", force: :cascade do |t|
    t.string "author"
    t.boolean "available"
    t.text "cover_url"
    t.datetime "created_at", null: false
    t.text "description"
    t.string "edition"
    t.string "genre"
    t.boolean "in_library", default: true, null: false
    t.string "isbn"
    t.integer "published_year"
    t.integer "rating"
    t.string "title"
    t.datetime "updated_at", null: false
    t.index ["isbn"], name: "index_books_on_isbn"
  end

  create_table "borrow_requests", force: :cascade do |t|
    t.integer "book_id", null: false
    t.integer "borrower_id", null: false
    t.datetime "created_at", null: false
    t.string "status", default: "pending", null: false
    t.datetime "updated_at", null: false
    t.index ["book_id"], name: "index_borrow_requests_on_book_id"
    t.index ["borrower_id"], name: "index_borrow_requests_on_borrower_id"
    t.index ["status"], name: "index_borrow_requests_on_status"
  end

  create_table "borrowers", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email"
    t.string "name", null: false
    t.integer "standing", default: 100, null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_borrowers_on_email", unique: true
  end

  create_table "invite_links", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "token", null: false
    t.datetime "updated_at", null: false
    t.index ["token"], name: "index_invite_links_on_token", unique: true
  end

  create_table "loans", force: :cascade do |t|
    t.integer "book_id", null: false
    t.integer "borrower_id", null: false
    t.datetime "checked_out_at", null: false
    t.datetime "created_at", null: false
    t.datetime "due_date", null: false
    t.datetime "due_soon_reminder_sent_at"
    t.datetime "due_today_reminder_sent_at"
    t.datetime "returned_at"
    t.datetime "updated_at", null: false
    t.index ["book_id", "returned_at"], name: "index_loans_on_book_id_and_returned_at"
    t.index ["book_id"], name: "index_loans_on_book_id"
    t.index ["borrower_id", "returned_at"], name: "index_loans_on_borrower_id_and_returned_at"
    t.index ["borrower_id"], name: "index_loans_on_borrower_id"
  end

  create_table "membership_invites", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "status", default: "pending", null: false
    t.datetime "updated_at", null: false
    t.integer "user_id", null: false
    t.index ["status"], name: "index_membership_invites_on_status"
    t.index ["user_id"], name: "index_membership_invites_on_user_id"
  end

  create_table "membership_requests", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "status", default: "pending", null: false
    t.datetime "updated_at", null: false
    t.integer "user_id", null: false
    t.index ["status"], name: "index_membership_requests_on_status"
    t.index ["user_id"], name: "index_membership_requests_on_user_id"
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

  create_table "sessions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "ip_address"
    t.datetime "updated_at", null: false
    t.string "user_agent"
    t.integer "user_id", null: false
    t.index ["user_id"], name: "index_sessions_on_user_id"
  end

  create_table "solid_cache_entries", force: :cascade do |t|
    t.integer "byte_size", null: false
    t.datetime "created_at", null: false
    t.binary "key", limit: 1024, null: false
    t.bigint "key_hash", null: false
    t.binary "value", limit: 536870912, null: false
    t.index ["byte_size"], name: "index_solid_cache_entries_on_byte_size"
    t.index ["key_hash", "byte_size"], name: "index_solid_cache_entries_on_key_hash_and_byte_size"
    t.index ["key_hash"], name: "index_solid_cache_entries_on_key_hash", unique: true
  end

  create_table "users", force: :cascade do |t|
    t.integer "borrower_id"
    t.datetime "created_at", null: false
    t.string "email_address", null: false
    t.string "name"
    t.boolean "owner", default: false, null: false
    t.string "password_digest", null: false
    t.datetime "updated_at", null: false
    t.index ["borrower_id"], name: "index_users_on_borrower_id"
    t.index ["email_address"], name: "index_users_on_email_address", unique: true
  end

  add_foreign_key "borrow_requests", "books"
  add_foreign_key "borrow_requests", "borrowers"
  add_foreign_key "loans", "books"
  add_foreign_key "loans", "borrowers"
  add_foreign_key "membership_invites", "users"
  add_foreign_key "membership_requests", "users"
  add_foreign_key "reading_statuses", "books"
  add_foreign_key "reading_statuses", "borrowers"
  add_foreign_key "sessions", "users"
  add_foreign_key "users", "borrowers"
end
