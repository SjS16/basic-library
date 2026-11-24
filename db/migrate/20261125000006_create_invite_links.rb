class CreateInviteLinks < ActiveRecord::Migration[8.1]
  def change
    create_table :invite_links do |t|
      t.string :token, null: false

      t.timestamps
    end

    add_index :invite_links, :token, unique: true
  end
end
