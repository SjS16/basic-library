class BorrowersController < ApplicationController
  before_action :set_borrower, only: [ :show, :edit, :update, :destroy, :checkout_book, :return_book, :reading_list_export ]
  before_action :require_owner, only: [ :index, :new, :create, :edit, :update, :destroy, :checkout_book, :return_book, :name_check ]
  before_action :require_owner_or_self, only: [ :show ]

  # GET /borrowers or /borrowers.json
  def index
    @borrowers = current_library.borrowers.order(standing: :desc)
    respond_to do |format|
      format.html
      format.json { render json: @borrowers.as_json(methods: [ :overdue_books_count ]) }
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
              include: :book,
              methods: [ :recommended_by_name, :recommendation_note ]
            }
          },
          methods: [ :standing_status, :standing_color, :overdue_books_count ]
        )
      }
    end
  end

  # GET /borrowers/name_check.json?name=Sam — owner only.
  # Powers the quick-add warning on the book page: members who
  # already use this name, and accounts with this name who may be
  # the same person (accounts link by email, not by name).
  def name_check
    name = params[:name].to_s.strip.downcase
    borrowers = Borrower.where("LOWER(name) = ?", name).order(:name)
    accounts = User.where("LOWER(name) = ?", name).order(:name)
    render json: {
      borrowers: borrowers.map { |b| { id: b.id, name: b.name, email: b.email } },
      accounts: accounts.map { |u| { id: u.id, name: u.name, email_address: u.email_address, member: u.borrower_id.present? } }
    }
  end

  # GET /borrowers/1/reading_list_export.csv — the member's own
  # reading list (all three shelves, in the order they appear on
  # the page) with their ratings and notes. Theirs alone to export.
  def reading_list_export
    unless current_user&.borrower == @borrower
      return render plain: "You can only export your own reading list.", status: :forbidden
    end

    require "csv"
    statuses = @borrower.reading_statuses.includes(:book).sort_by do |status|
      [ status.status, status.book.author.to_s.downcase, status.book.title.to_s.downcase ]
    end
    csv = CSV.generate do |rows|
      rows << [ "Title", "Author", "List", "Rating", "Notes" ]
      statuses.each do |status|
        rows << [ status.book.title, status.book.author, status.status.humanize, status.rating, status.notes ]
      end
    end
    send_data csv, filename: "reading-list-#{Date.current}.csv", type: "text/csv"
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
  # Refuses while the member still has books out: destroying the
  # record would destroy the open loans with it and leave those
  # books marked unavailable forever. A linked login account is
  # unlinked, not deleted — it just stops being a member.
  def destroy
    if @borrower.current_loans.exists?
      titles = @borrower.current_loans.includes(:book).map { |loan| loan.book.title }
      message = "#{@borrower.name} still has #{titles.size} #{'book'.pluralize(titles.size)} out (#{titles.join(', ')}). Mark them returned before removing this member."
      respond_to do |format|
        format.html { redirect_to borrowers_path, alert: message }
        format.json { render json: { error: message }, status: :unprocessable_entity }
      end
      return
    end

    User.where(borrower: @borrower).update_all(borrower_id: nil)
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

  def require_owner_or_self
    return if owner? || current_user&.borrower == @borrower

    redirect_to root_path, alert: "You can only view your own borrower page."
  end

  def set_borrower
    @borrower = Borrower.find(params[:id])
  end

  def borrower_params
    params.require(:borrower).permit(:name, :email, :standing)
  end
end
