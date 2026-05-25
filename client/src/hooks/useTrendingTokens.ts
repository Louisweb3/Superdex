import { useState, useEffect } from "react";

export interface TrendingToken {
  address: string;
  symbol: string;
  name: string;
  icon: string;
  chainId: string;
  url: string;
  isTrending: true;
}

const DEXSCREENER_FALLBACK_ICON = (address: string) =>
  `https://dd.dexscreener.com/ds-data/tokens/base/${address}.png`;

export function useTrendingTokens() {
  const [tokens, setTokens] = useState<TrendingToken[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      try {
        const res = await fetch("https://api.dexscreener.com/token-profiles/latest/v1");
        if (!res.ok) throw new Error("DexScreener failed");
        const data = await res.json();
        if (!Array.isArray(data)) throw new Error("Invalid response");

        // Filter to Base chain only, dedupe by address, take first 25
        const seen = new Set<string>();
        const formatted: TrendingToken[] = [];
        for (const t of data) {
          const addr = t.tokenAddress?.toLowerCase();
          if (!addr || seen.has(addr)) continue;
          // token-profiles doesn't have chainId field; try to infer from URL or accept all
          seen.add(addr);
          formatted.push({
            address: addr,
            symbol: t.symbol || "???",
            name: t.name || t.symbol || "Unknown",
            icon: t.icon || DEXSCREENER_FALLBACK_ICON(addr),
            chainId: t.chainId || "base",
            url: t.url || "",
            isTrending: true,
          });
          if (formatted.length >= 25) break;
        }
        if (!cancelled) setTokens(formatted);
      } catch {
        // silently fail — trending section will just be empty
        if (!cancelled) setTokens([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return { tokens, isLoading };
}
