import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { LocalStorageDepthChartStore } from "./store/LocalStorageDepthChartStore";
import "./styles.css";

const store = new LocalStorageDepthChartStore();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App store={store} />
  </StrictMode>,
);
