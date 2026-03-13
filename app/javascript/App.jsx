import React from "react";
import { Routes, Route } from "react-router-dom";
import "./stylesheets/application.tailwind.css";
import NavBar from "./components/NavBar";
import Home from "./components/Home";
import BooksList from "./components/books/BooksList";
import ShowBook from "./components/books/ShowBook";
import EditBook from "./components/books/EditBook";
import BorrowersList from "./components/borrowers/BorrowersList";
import ShowBorrower from "./components/borrowers/ShowBorrower";
import EditBorrower from "./components/borrowers/EditBorrower";

function App() {
  return (
    <div className="min-h-screen bg-amber-50" style={{backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23000000\" fill-opacity=\"0.02\"%3E%3Cpath d=\"M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')"}}>
      <NavBar />
      <main className="pt-20 sm:pt-26 pb-8 sm:pb-12 max-w-7xl mx-auto px-4 sm:px-6">
        <Routes>
          <Route path="/" element={<Home />} />
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