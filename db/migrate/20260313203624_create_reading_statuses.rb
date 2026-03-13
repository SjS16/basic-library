class CreateReadingStatuses < ActiveRecord::Migration[8.1]
  def change
    create_table :reading_statuses do |t|
      t.references :borrower, null: false, foreign_key: true
      t.references :book, null: false, foreign_key: true
      t.integer :status, null: false, default: 0
      t.integer :rating
      t.text :notes

      t.timestamps
    end

    add_index :reading_statuses, [ :borrower_id, :book_id ], unique: true
  end
end
