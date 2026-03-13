class HomeController < ApplicationController
  def index
    @total_books = Book.count
    @available_books = Book.where(available: true).count
    @total_borrowers = Borrower.count
    @active_loans = Loan.active.count
    @recent_books = Book.order(created_at: :desc).limit(6)
  end
end
