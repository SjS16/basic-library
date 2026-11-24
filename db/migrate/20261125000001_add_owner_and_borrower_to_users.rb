class AddOwnerAndBorrowerToUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :owner, :boolean, default: false, null: false
    add_reference :users, :borrower, foreign_key: true
  end
end
