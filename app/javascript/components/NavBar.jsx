// NavBar.jsx
import React from "react";

function NavBar() {
  return (
    <nav className="bg-blue-600 text-white p-4 shadow-md fixed w-full top-0">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <h1 className="text-xl font-bold">Library</h1>
        <ul className="flex space-x-6">
          <li><a href="/books" className="hover:text-gray-200">Books</a></li>
          <li><a href="/books/new" className="hover:text-gray-200">New Book</a></li>
        </ul>
      </div>
    </nav>
  );
}

export default NavBar;
