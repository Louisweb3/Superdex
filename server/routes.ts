import type { Express } from "express";
import { createServer, type Server } from "http";

const ZEROX_API_KEY = process.env.ZEROX_API_KEY || "";
const ZEROX_BASE_URL = "https://api.0x.org";
const CHAIN_ID = 8453; // Base
const FEE_RECIPIENT = "0x07808cD830c5D599dF3CC95a9Cf43EBada5B373a";
const FEE_BPS = 30; // 0.3%

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Proxy 0x price (no taker required, for live estimation while typing)
  app.get("/api/swap/price", async (req, res) => {
    try {
      const { sellToken, buyToken, sellAmount, slippageBps, includedSources, excludedSources } = req.query;

      if (!sellToken || !buyToken || !sellAmount) {
        return res.status(400).json({ error: "Missing required parameters" });
      }

      const params = new URLSearchParams({
        chainId: String(CHAIN_ID),
        sellToken: String(sellToken),
        buyToken: String(buyToken),
        sellAmount: String(sellAmount),
        swapFeeRecipient: FEE_RECIPIENT,
        swapFeeBps: String(FEE_BPS),
        swapFeeToken: String(sellToken),
      });

      if (slippageBps) params.set("slippageBps", String(slippageBps));
      if (includedSources) params.set("includedSources", String(includedSources));
      if (excludedSources) params.set("excludedSources", String(excludedSources));

      const response = await fetch(`${ZEROX_BASE_URL}/swap/allowance-holder/price?${params.toString()}`, {
        headers: {
          "0x-api-key": ZEROX_API_KEY,
          "0x-version": "v2",
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (!response.ok) return res.status(response.status).json(data);
      return res.json(data);
    } catch (err: any) {
      console.error("0x price error:", err);
      return res.status(500).json({ error: err.message });
    }
  });

  // Proxy 0x quote (requires taker, returns calldata for on-chain execution)
  app.get("/api/swap/quote", async (req, res) => {
    try {
      const { sellToken, buyToken, sellAmount, taker, slippageBps, includedSources, excludedSources } = req.query;

      if (!sellToken || !buyToken || !sellAmount || !taker) {
        return res.status(400).json({ error: "Missing required parameters: sellToken, buyToken, sellAmount, taker" });
      }

      const params = new URLSearchParams({
        chainId: String(CHAIN_ID),
        sellToken: String(sellToken),
        buyToken: String(buyToken),
        sellAmount: String(sellAmount),
        taker: String(taker),
        swapFeeRecipient: FEE_RECIPIENT,
        swapFeeBps: String(FEE_BPS),
        swapFeeToken: String(sellToken),
      });

      if (slippageBps) params.set("slippageBps", String(slippageBps));
      if (includedSources) params.set("includedSources", String(includedSources));
      if (excludedSources) params.set("excludedSources", String(excludedSources));

      const response = await fetch(`${ZEROX_BASE_URL}/swap/allowance-holder/quote?${params.toString()}`, {
        headers: {
          "0x-api-key": ZEROX_API_KEY,
          "0x-version": "v2",
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (!response.ok) return res.status(response.status).json(data);
      return res.json(data);
    } catch (err: any) {
      console.error("0x quote error:", err);
      return res.status(500).json({ error: err.message });
    }
  });

  return httpServer;
}
