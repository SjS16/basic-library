class AddEditionToBooks < ActiveRecord::Migration[8.1]
  def change
    add_column :books, :edition, :string
  end
end
