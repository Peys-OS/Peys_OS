import { createRoot } from "react-dom/client";
import { WagmiProvider } from "@privy-io/wagmi";
import { config } from "@/lib/wagmi";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <WagmiProvider config={config}>
    <App />
  </WagmiProvider>
);
