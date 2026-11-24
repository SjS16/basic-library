class BooksController < ApplicationController
  before_action :set_book, only: %i[ show edit update destroy ]
  before_action :require_owner, only: %i[ new create edit update destroy export ]

  # GET /books or /books.json
  def index
    @books = Book.in_library
    respond_to do |format|
      format.html # normal Rails HTML
      format.json { render json: @books } # JSON endpoint
    end
  end

  # GET /books/export.csv — owner only. The whole collection as a
  # spreadsheet file, so the catalogue exists somewhere besides
  # this database. Includes wishlist records, flagged as such.
  def export
    require "csv"
    csv = CSV.generate do |rows|
      rows << [ "Title", "Author", "Genre", "Published Year", "ISBN", "Rating", "Available", "In Library", "Added" ]
      Book.order(:author, :title).find_each do |book|
        rows << [ book.title, book.author, book.genre, book.published_year, book.isbn, book.rating,
                  book.available ? "Yes" : "No", book.in_library ? "Yes" : "No", book.created_at.to_date ]
      end
    end
    send_data csv, filename: "library-catalogue-#{Date.current}.csv", type: "text/csv"
  end

  # GET /books/1 or /books/1.json
  def show
    @book = Book.find(params[:id])
    respond_to do |format|
      format.html
      format.json {
        # Include who currently has the book, so its page can link
        # to that member.
        loan = @book.current_loan
        render json: @book.as_json.merge(
          "current_loan" => loan&.as_json(
            only: [ :id, :due_date, :checked_out_at ],
            include: { borrower: { only: [ :id, :name ] } }
          )
        )
      }
    end
  end

  # GET /books/new
  def new
    @book = Book.new
    respond_to do |format|
      format.html
      format.json { render json: @book }
    end
  end

  # GET /books/1/edit
  def edit
    @book = Book.find(params[:id])
    respond_to do |format|
      format.html
      format.json { render json: @book }
    end
  end

  # POST /books or /books.json
  def create
    # If a member previously wished for this book, its record exists
    # flagged as not in the library. Adding it for real claims that
    # record, so members' lists now point at the owner's copy.
    # An ISBN from Open Library is the strongest match; title +
    # author is the fallback.
    existing = nil
    if book_params[:isbn].present?
      existing = Book.where(isbn: book_params[:isbn].to_s.strip).first
    end
    existing ||= Book.where("lower(title) = :title AND lower(author) = :author",
                            title: book_params[:title].to_s.strip.downcase,
                            author: book_params[:author].to_s.strip.downcase).first
    @book = (existing && !existing.in_library?) ? existing : Book.new(book_params)

    saved = if @book.new_record?
              @book.save
            else
              @book.update(book_params.merge(in_library: true, available: true))
            end

    respond_to do |format|
      if saved
        format.html { redirect_to @book, notice: "Book was successfully created." }
        format.json { render :show, status: :created, location: @book }
      else
        format.html { render :new, status: :unprocessable_entity }
        format.json { render json: @book.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /books/1 or /books/1.json
  def update
    respond_to do |format|
      if @book.update(book_params)
        format.html { redirect_to @book, notice: "Book was successfully updated.", status: :see_other }
        format.json { render :show, status: :ok, location: @book }
      else
        format.html { render :edit, status: :unprocessable_entity }
        format.json { render json: @book.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /books/1 or /books/1.json
  def destroy
    @book.destroy!

    respond_to do |format|
      format.html { redirect_to books_path, notice: "Book was successfully destroyed.", status: :see_other }
      format.json { head :no_content }
    end
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_book
      @book = Book.find(params[:id])
    end

    # Only allow a list of trusted parameters through.
    def book_params
      params.require(:book).permit(:title, :author, :description, :published_year, :available, :genre, :rating, :cover_url, :isbn)
    end
end
