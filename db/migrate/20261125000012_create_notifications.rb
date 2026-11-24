class CreateNotifications < ActiveRecord::Migration[8.1]
  def change
    create_table :notifications do |t|
      t.references :user, null: false, foreign_key: true
      t.string :kind, null: false
      t.references :book, foreign_key: true
      t.references :borrower, foreign_key: true

      t.timestamps
    end
  end
end
