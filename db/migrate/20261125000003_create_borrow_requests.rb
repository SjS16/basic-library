class CreateBorrowRequests < ActiveRecord::Migration[8.1]
  def change
    create_table :borrow_requests do |t|
      t.references :borrower, null: false, foreign_key: true
      t.references :book, null: false, foreign_key: true
      t.string :status, null: false, default: "pending"

      t.timestamps
    end

    add_index :borrow_requests, :status
  end
end
