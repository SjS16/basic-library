class AddInLibraryToBooks < ActiveRecord::Migration[8.1]
  def change
    add_column :books, :in_library, :boolean, default: true, null: false
  end
end
