import React from "react";
import { Routes, Route } from "react-router-dom";
import "./stylesheets/application.tailwind.css";
import NavBar from "./components/NavBar";
import BooksList from "./components/Books/BooksList";
import ShowBook from "./components/books/ShowBook";
import EditBook from "./components/books/EditBook";
import BorrowersList from "./components/borrowers/BorrowersList";
import ShowBorrower from "./components/borrowers/ShowBorrower";
import EditBorrower from "./components/borrowers/EditBorrower";

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <NavBar />
      <main className="pt-20 sm:pt-26 pb-8 sm:pb-12 max-w-7xl mx-auto px-4 sm:px-6">
        <Routes>
          <Route path="/books" element={<BooksList />} />
          <Route path="/books/:id" element={<ShowBook />} />
          <Route path="/books/:id/edit" element={<EditBook />} />
          <Route path="/books/new" element={<EditBook />} />
          
          <Route path="/borrowers" element={<BorrowersList />} />
          <Route path="/borrowers/:id" element={<ShowBorrower />} />
          <Route path="/borrowers/:id/edit" element={<EditBorrower />} />
          <Route path="/borrowers/new" element={<EditBorrower />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;