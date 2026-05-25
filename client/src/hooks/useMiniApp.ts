import { useEffect, useState, useCallback } from "react";

/* ── Base Mini App detection & integration ───────────────────────────────────────────────────────────────────
 * Detects whether the app is running inside the Base App / Coinbase Wallet
 * Mini App frame. When detected, it auto-connects the pre-authorised
 * wallet and signals "frame ready" to the host so the loading spinner
 * disappears.
 *
 * References:
 *   https://docs.base.org/builderkits/minikit/existing-app-integration
 *   https://miniapps.farcaster.xyz/docs/specification
 */

interface MiniAppContext {
  isMiniApp: boolean;
  isFrameReady: boolean;
  setFrameReady: () => void;
}

export function useMiniApp(): MiniAppContext {
  const [isMiniApp, setIsMiniApp] = useState(false);
  const [isFrameReady, setIsFrameReadyState] = useState(false);

  useEffect(() => {
    // Heuristic: inside Base App / Coinbase Wallet when:
    //   1. window !== window.top (nested iframe)
    //   2. OR the host injected a `coinbaseWallet` provider
    //   3. OR the user agent hints at Coinbase Wallet
    const inIframe = typeof window !== "undefined" && window.self !== window.top;
    const hasCbProvider =
      typeof window !== "undefined" &&
      !!(window as any).coinbaseWalletExtension ||
      !!(window as any).coinbaseWallet;
    const ua = typeof navigator !== "undefined" ? navigator.userAgent.toLowerCase() : "";
    const uaMatch = ua.includes("coinbase") || ua.includes("coinbasewallet");

    const detected = inIframe || hasCbProvider || uaMatch;
    setIsMiniApp(detected);

    // If we’re inside a frame, wait a tick then signal ready
    if (detected && inIframe) {
      // The host (Base App / Warpcast) listens for postMessage
      // from the child frame. We send the standard frame-ready
      // handshake so the parent can remove the splash screen.
      const timer = setTimeout(() => {
        try {
          (window as any).parent?.postMessage(
            { type: "frameReady", url: window.location.href },
            "*"
          );
        } catch {
          // sandboxed iframe → silently ignore
        }
        setIsFrameReadyState(true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, []);

  const setFrameReady = useCallback(() => {
    if (!isFrameReady) {
      try {
        (window as any).parent?.postMessage(
          { type: "frameReady", url: window.location.href },
          "*"
        );
      } catch {
        // ignore
      }
      setIsFrameReadyState(true);
    }
  }, [isFrameReady]);

  return { isMiniApp, isFrameReady, setFrameReady };
}
