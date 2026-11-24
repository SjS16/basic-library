class CreateLibraries < ActiveRecord::Migration[8.1]
  # The model is BookLibrary, not Library: this app's own module
  # is named Library (config/application.rb), so a top-level
  # Library class can never load alongside it.
  class MigrationBookLibrary < ActiveRecord::Base
    self.table_name = "book_libraries"
  end

  class MigrationUser < ActiveRecord::Base
    self.table_name = "users"
  end

  def up
    create_table :book_libraries do |t|
      t.string :name, null: false, default: "My Library"
      t.references :owner, foreign_key: { to_table: :users }
      t.timestamps
    end

    add_reference :books, :book_library, foreign_key: true
    add_reference :borrowers, :book_library, foreign_key: true

    # Backfill: the existing catalogue and member list become one
    # library, owned by the app's owner account. On an empty
    # database (a fresh test run) there is nothing to backfill;
    # the app creates its default library lazily instead.
    owner = MigrationUser.where(owner: true).first || MigrationUser.first
    if owner
      library = MigrationBookLibrary.create!(name: "My Library", owner_id: owner.id)
      execute "UPDATE books SET book_library_id = #{library.id} WHERE book_library_id IS NULL"
      execute "UPDATE borrowers SET book_library_id = #{library.id} WHERE book_library_id IS NULL"
    end
  end

  def down
    remove_reference :borrowers, :book_library, foreign_key: true
    remove_reference :books, :book_library, foreign_key: true
    drop_table :book_libraries
  end
end
