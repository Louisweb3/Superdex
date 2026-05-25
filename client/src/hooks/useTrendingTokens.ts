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
        // 1. Fetch latest token profiles
        const res = await fetch("https://api.dexscreener.com/token-profiles/latest/v1");
        if (!res.ok) throw new Error("DexScreener profiles failed");
        const profiles = await res.json();
        if (!Array.isArray(profiles)) throw new Error("Invalid response");

        // 2. Filter to Base chain only, dedupe by address
        const seen = new Set<string>();
        const baseProfiles: { address: string; icon: string; url: string }[] = [];
        for (const p of profiles) {
          const addr = p.tokenAddress?.toLowerCase();
          if (!addr || seen.has(addr)) continue;
          if (p.chainId !== "base") continue;
          seen.add(addr);
          baseProfiles.push({
            address: addr,
            icon: p.icon || DEXSCREENER_FALLBACK_ICON(addr),
            url: p.url || "",
          });
          if (baseProfiles.length >= 15) break;
        }

        if (baseProfiles.length === 0) {
          if (!cancelled) setTokens([]);
          return;
        }

        // 3. Fetch symbol/name via bulk token endpoint
        const addrs = baseProfiles.map((p) => p.address).join(",");
        const detailRes = await fetch(
          `https://api.dexscreener.com/tokens/v1/base/${addrs}`
        );
        let details: Record<string, { symbol?: string; name?: string }> = {};
        if (detailRes.ok) {
          const detailData = await detailRes.json();
          // Response is either a single object or array of objects
          const arr = Array.isArray(detailData) ? detailData : [detailData];
          for (const d of arr) {
            if (d.tokenAddress) {
              details[d.tokenAddress.toLowerCase()] = {
                symbol: d.symbol,
                name: d.name,
              };
            } else if (d.pairs?.[0]?.baseToken?.address) {
              details[d.pairs[0].baseToken.address.toLowerCase()] = {
                symbol: d.pairs?.[0]?.baseToken?.symbol,
                name: d.pairs?.[0]?.baseToken?.name,
              };
            }
          }
        }

        // 4. Merge profiles with details
        const formatted: TrendingToken[] = baseProfiles.map((p) => {
          const d = details[p.address];
          return {
            address: p.address,
            symbol: d?.symbol || "???",
            name: d?.name || d?.symbol || "Unknown Token",
            icon: p.icon,
            chainId: "base",
            url: p.url,
            isTrending: true,
          };
        });

        if (!cancelled) setTokens(formatted);
      } catch {
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
