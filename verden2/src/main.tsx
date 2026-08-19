import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

if (typeof document !== "undefined") {
  const rootElement = document.getElementById("root");
  if (rootElement && !rootElement.innerHTML) {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  }
}

export default App;
