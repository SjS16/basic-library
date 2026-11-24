class MeController < ApplicationController
  # GET /me.json: who is signed in, so the React app can show the right
  # menus and buttons (owner tools, the viewer's own reading list).
  def show
    render json: {
      name: current_user.name,
      email_address: current_user.email_address,
      owner: current_user.owner?,
      borrower_id: current_user.borrower_id
    }
  end
end
