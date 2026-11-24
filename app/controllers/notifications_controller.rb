class NotificationsController < ApplicationController
  # GET /notifications — HTML loads the React app; JSON feeds the
  # banner. Only the signed-in account's own notifications.
  def index
    respond_to do |format|
      format.html { render template: "home/index" }
      format.json do
        notifications = current_user.notifications.recent_first.includes(:book, :borrower)
        render json: { notifications: notifications.map { |notification| notification_json(notification) } }
      end
    end
  end

  # DELETE /notifications/:id.json — dismiss. Dismissing deletes
  # the row; there is no separate read state to keep.
  def destroy
    current_user.notifications.find(params[:id]).destroy!
    head :no_content
  end

  private

  def notification_json(notification)
    {
      id: notification.id,
      kind: notification.kind,
      created_at: notification.created_at,
      book: notification.book&.as_json(only: [ :id, :title ]),
      borrower: notification.borrower&.as_json(only: [ :id, :name ])
    }
  end
end
