class ReadingStatusesController < ApplicationController
  before_action :set_borrower
  before_action :set_reading_status, only: [ :update, :destroy ]

  # POST /borrowers/:borrower_id/reading_statuses
  def create
    @reading_status = @borrower.reading_statuses.build(reading_status_params)

    respond_to do |format|
      if @reading_status.save
        format.html { redirect_to @borrower, notice: "Reading status added." }
        format.json { render json: @reading_status, status: :created }
      else
        format.html { redirect_to @borrower, alert: @reading_status.errors.full_messages.join(", ") }
        format.json { render json: @reading_status.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /borrowers/:borrower_id/reading_statuses/:id
  def update
    respond_to do |format|
      if @reading_status.update(reading_status_params)
        format.html { redirect_to @borrower, notice: "Reading status updated." }
        format.json { render json: @reading_status, status: :ok }
      else
        format.html { redirect_to @borrower, alert: @reading_status.errors.full_messages.join(", ") }
        format.json { render json: @reading_status.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /borrowers/:borrower_id/reading_statuses/:id
  def destroy
    @reading_status.destroy!

    respond_to do |format|
      format.html { redirect_to @borrower, notice: "Reading status removed." }
      format.json { head :no_content }
    end
  end

  private

  def set_borrower
    @borrower = Borrower.find(params[:borrower_id])
  end

  def set_reading_status
    @reading_status = @borrower.reading_statuses.find(params[:id])
  end

  def reading_status_params
    params.require(:reading_status).permit(:book_id, :status, :rating, :notes)
  end
end
