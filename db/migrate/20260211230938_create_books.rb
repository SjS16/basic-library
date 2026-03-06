class CreateBooks < ActiveRecord::Migration[8.1]
  def change
    create_table :books do |t|
      t.string :title
      t.string :author
      t.text :description
      t.integer :published_year
      t.boolean :available
      t.string :genre

      t.timestamps
    end
  end
end
