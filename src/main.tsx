import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

// Service Worker временно отключён для решения проблем с загрузкой
// Включим позже, когда всё будет работать стабильно

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
