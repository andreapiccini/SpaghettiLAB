import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { productionExtensions } from "./extensions/registry.js";
import { installProductionExtensions } from "virtual:spaghettilab-extensions";
import "./index.css";

installProductionExtensions(productionExtensions);
void productionExtensions.startServices();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
