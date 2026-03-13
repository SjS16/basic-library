class BorrowersController < ApplicationController
  before_action :set_borrower, only: [ :show, :edit, :update, :destroy, :checkout_book, :return_book ]

  # GET /borrowers or /borrowers.json
  def index
    @borrowers = Borrower.all.order(standing: :desc)
    respond_to do |format|
      format.html
      format.json { render json: @borrowers }
    end
  end

  # GET /borrowers/1 or /borrowers/1.json
  def show
    respond_to do |format|
      format.html
      format.json {
        render json: @borrower.as_json(
          include: {
            current_loans: {
              include: :book
            },
            reading_statuses: {
              include: :book
            }
          },
          methods: [ :standing_status, :standing_color ]
        )
      }
    end
  end

  # GET /borrowers/new
  def new
    @borrower = Borrower.new
  end

  # GET /borrowers/1/edit
  def edit
  end

  # POST /borrowers or /borrowers.json
  def create
    @borrower = Borrower.new(borrower_params)

    respond_to do |format|
      if @borrower.save
        format.html { redirect_to @borrower, notice: "Borrower was successfully created." }
        format.json { render json: @borrower, status: :created }
      else
        format.html { render :new, status: :unprocessable_entity }
        format.json { render json: @borrower.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /borrowers/1 or /borrowers/1.json
  def update
    respond_to do |format|
      if @borrower.update(borrower_params)
        format.html { redirect_to @borrower, notice: "Borrower was successfully updated." }
        format.json { render json: @borrower, status: :ok }
      else
        format.html { render :edit, status: :unprocessable_entity }
        format.json { render json: @borrower.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /borrowers/1 or /borrowers/1.json
  def destroy
    @borrower.destroy!

    respond_to do |format|
      format.html { redirect_to borrowers_path, notice: "Borrower was successfully destroyed." }
      format.json { head :no_content }
    end
  end

  # POST /borrowers/1/checkout_book
  def checkout_book
    book = Book.find(params[:book_id])

    loan = @borrower.loans.build(
      book: book,
      checked_out_at: Time.current,
      due_date: 2.weeks.from_now
    )

    respond_to do |format|
      if loan.save
        format.html { redirect_to @borrower, notice: "Book checked out successfully." }
        format.json { render json: loan, status: :created }
      else
        format.html { redirect_to @borrower, alert: loan.errors.full_messages.join(", ") }
        format.json { render json: loan.errors, status: :unprocessable_entity }
      end
    end
  end

  # POST /borrowers/1/return_book
  def return_book
    loan = @borrower.current_loans.find_by(book_id: params[:book_id])

    respond_to do |format|
      if loan&.return_book!
        format.html { redirect_to @borrower, notice: "Book returned successfully." }
        format.json { render json: loan, status: :ok }
      else
        format.html { redirect_to @borrower, alert: "Could not return book." }
        format.json { render json: { error: "Could not return book" }, status: :unprocessable_entity }
      end
    end
  end

  private

  def set_borrower
    @borrower = Borrower.find(params[:id])
  end

  def borrower_params
    params.require(:borrower).permit(:name, :email, :standing)
  end
end
