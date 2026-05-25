import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Mini App auto-connect: if running inside Base App / Coinbase Wallet
// frame, connect silently without showing the "Connect Wallet" UI.
// This is done before React mounts so the wallet state is already
// initialised when components render.
async function bootstrap() {
  const inIframe = window.self !== window.top;
  const hasCbProvider = !!(window as any).coinbaseWalletExtension || !!(window as any).coinbaseWallet;
  if ((inIframe || hasCbProvider) && (window as any).ethereum) {
    try {
      const accounts: string[] = await (window as any).ethereum.request({ method: "eth_accounts" });
      if (accounts.length === 0) {
        await (window as any).ethereum.request({ method: "eth_requestAccounts" });
      }
    } catch {
      // ignore — user will see Connect button as fallback
    }
  }
  createRoot(document.getElementById("root")!).render(<App />);
}

bootstrap();
