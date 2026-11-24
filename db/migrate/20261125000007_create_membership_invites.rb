class CreateMembershipInvites < ActiveRecord::Migration[8.1]
  def change
    create_table :membership_invites do |t|
      t.references :user, null: false, foreign_key: true
      t.string :status, null: false, default: "pending"

      t.timestamps
    end

    add_index :membership_invites, :status
  end
end
