class CreateBorrowers < ActiveRecord::Migration[8.1]
  def change
    create_table :borrowers do |t|
      t.string :name, null: false
      t.integer :standing, default: 100, null: false
      t.string :email

      t.timestamps
    end
    
    add_index :borrowers, :email, unique: true
  end
end
