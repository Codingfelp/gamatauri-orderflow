import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ActiveOrderProvider } from "./contexts/ActiveOrderContext";

createRoot(document.getElementById("root")!).render(
  <ActiveOrderProvider>
    <App />
  </ActiveOrderProvider>
);
