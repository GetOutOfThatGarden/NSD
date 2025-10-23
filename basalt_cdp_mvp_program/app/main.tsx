
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { SolanaProvider } from "./solana/SolanaProvider";

createRoot(document.getElementById("root")!).render(
  <SolanaProvider>
    <App />
  </SolanaProvider>
);
  