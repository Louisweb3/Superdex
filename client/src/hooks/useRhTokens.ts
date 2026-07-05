import { useState, useEffect } from "react";
import type { Token } from "@/lib/tokens";
import { NATIVE_ETH_ADDRESS } from "@/lib/tokens";

// Robinhood Chain has real ERC-20 liquidity (Uniswap V3/V4 pools) — Blockscout
// indexes the chain's tokens directly, so we use it as the token list source
// instead of DexScreener (which doesn't cover this chain yet).
const BLOCKSCOUT_API = "https://robinhoodchain.blockscout.com/api/v2/tokens?type=ERC-20";

const ETH_ICON = "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png";

export function useRhTokens() {
  const [tokens, setTokens] = useState<Token[]>([
    {
      symbol: "ETH",
      name: "Ethereum",
      address: NATIVE_ETH_ADDRESS,
      decimals: 18,
      icon: ETH_ICON,
      isNative: true,
    },
  ]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const res = await fetch(BLOCKSCOUT_API);
        if (!res.ok) return;
        const data = await res.json();
        const items: any[] = Array.isArray(data.items) ? data.items : [];

        const erc20Tokens: Token[] = items
          .filter((t) => t.reputation !== "scam" && t.address_hash)
          .map((t) => {
            const price = t.exchange_rate ? parseFloat(t.exchange_rate) : undefined;
            return {
              symbol: t.symbol ?? "???",
              name: t.name ?? t.symbol ?? "Unknown",
              address: t.address_hash,
              decimals: parseInt(t.decimals ?? "18", 10) || 18,
              icon: t.icon_url || "/figmaAssets/image-7.png",
              price: price && !isNaN(price) ? price : undefined,
              isTrending: parseInt(t.holders_count ?? "0", 10) > 100,
            } as Token;
          });

        const merged: Token[] = [
          {
            symbol: "ETH",
            name: "Ethereum",
            address: NATIVE_ETH_ADDRESS,
            decimals: 18,
            icon: ETH_ICON,
            isNative: true,
            price: erc20Tokens.find((t) => t.symbol === "WETH")?.price,
          },
          ...erc20Tokens,
        ];

        if (!cancelled) setTokens(merged);
      } catch (e) {
        console.error("useRhTokens error:", e);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { tokens, isLoading };
}
