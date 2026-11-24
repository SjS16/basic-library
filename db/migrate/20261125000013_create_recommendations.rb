class CreateRecommendations < ActiveRecord::Migration[8.1]
  def change
    create_table :recommendations do |t|
      t.references :recommender, null: false, foreign_key: { to_table: :borrowers }
      t.references :recipient, null: false, foreign_key: { to_table: :borrowers }
      t.references :book, null: false, foreign_key: true
      t.text :note
      t.integer :status, null: false, default: 0

      t.timestamps
    end

    add_index :recommendations, [ :recipient_id, :status ]
  end
end
