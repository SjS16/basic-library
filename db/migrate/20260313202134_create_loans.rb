class CreateLoans < ActiveRecord::Migration[8.1]
  def change
    create_table :loans do |t|
      t.references :borrower, null: false, foreign_key: true
      t.references :book, null: false, foreign_key: true
      t.datetime :checked_out_at, null: false
      t.datetime :due_date, null: false
      t.datetime :returned_at

      t.timestamps
    end
    
    add_index :loans, [:book_id, :returned_at]
    add_index :loans, [:borrower_id, :returned_at]
  end
end
