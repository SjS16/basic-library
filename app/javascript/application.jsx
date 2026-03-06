import React from "react";
import ReactDOM from "react-dom/client";
import "./stylesheets/application.tailwind.css";
import App from "./App";
import { BrowserRouter } from "react-router-dom";

document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("react-root");
  if (root) {
    ReactDOM.createRoot(root).render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
  }
});
