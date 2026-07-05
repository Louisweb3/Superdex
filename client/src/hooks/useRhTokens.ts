import { useState, useEffect } from "react";
import type { Token } from "@/lib/tokens";
import { NATIVE_ETH_ADDRESS } from "@/lib/tokens";

// Robinhood Chain has real ERC-20 liquidity (Uniswap V3/V4 pools). Blockscout
// indexes every deployed token on the chain, so it's our source of truth for
// which tokens exist. DexScreener also covers this chain (chainId "robinhood")
// and gives us real logos + liquidity data for the subset of tokens it has
// indexed — but DexScreener doesn't cover every liquid pair (e.g. USDE has real
// 0x liquidity but no DexScreener pair), so we only use it to ENRICH the list
// (better icon, price, "trending" flag), never to hide a token that Blockscout
// confirms is a real deployed ERC-20. Actual swappability is always verified
// live by the 0x price/quote call when the user picks a pair.
const BLOCKSCOUT_API = "https://robinhoodchain.blockscout.com/api/v2/tokens?type=ERC-20";
const DEXSCREENER_CHAIN = "robinhood";
const DEXSCREENER_TOKENS_URL = `https://api.dexscreener.com/tokens/v1/${DEXSCREENER_CHAIN}`;
const DEXSCREENER_PROFILES_URL = "https://api.dexscreener.com/token-profiles/latest/v1";

const ETH_ICON = "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png";
const WETH_ADDRESS = "0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73".toLowerCase();

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

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
        // ── Step 1: full token list from Blockscout (source of truth) ───────
        const bsRes = await fetch(BLOCKSCOUT_API);
        if (!bsRes.ok) return;
        const bsData = await bsRes.json();
        const items: any[] = Array.isArray(bsData.items) ? bsData.items : [];

        const candidates = items
          .filter((t) => t.reputation !== "scam" && t.address_hash)
          .map((t) => ({
            address: (t.address_hash as string).toLowerCase(),
            symbol: t.symbol ?? "???",
            name: t.name ?? t.symbol ?? "Unknown",
            decimals: parseInt(t.decimals ?? "18", 10) || 18,
            icon: t.icon_url as string | undefined,
            fallbackPrice: t.exchange_rate ? parseFloat(t.exchange_rate) : undefined,
            holders: parseInt(t.holders_count ?? "0", 10) || 0,
          }));

        // ── Step 2: enrich with DexScreener logos/prices where available ────
        const bestByAddr: Record<
          string,
          { symbol: string; name: string; priceUsd: number; imageUrl?: string; liquidityUsd: number }
        > = {};

        const batches = chunk(candidates.map((c) => c.address), 30);
        await Promise.all(
          batches.map(async (batch) => {
            try {
              const res = await fetch(`${DEXSCREENER_TOKENS_URL}/${batch.join(",")}`);
              if (!res.ok) return;
              const pairs: any[] = await res.json();
              if (!Array.isArray(pairs)) return;
              for (const pair of pairs) {
                const liq = pair.liquidity?.usd ?? 0;
                const priceUsd = parseFloat(pair.priceUsd ?? "0") || 0;
                const baseAddr = pair.baseToken?.address?.toLowerCase();
                if (baseAddr) {
                  const existing = bestByAddr[baseAddr];
                  if (!existing || liq > existing.liquidityUsd) {
                    bestByAddr[baseAddr] = {
                      symbol: pair.baseToken.symbol,
                      name: pair.baseToken.name,
                      priceUsd,
                      imageUrl: pair.info?.imageUrl,
                      liquidityUsd: liq,
                    };
                  }
                }
                // Quote-side tokens (often WETH) won't have a priceUsd of their own here,
                // but their presence in a real pair still confirms liquidity/logo info.
                const quoteAddr = pair.quoteToken?.address?.toLowerCase();
                if (quoteAddr) {
                  const existing = bestByAddr[quoteAddr];
                  if (!existing || liq > existing.liquidityUsd) {
                    bestByAddr[quoteAddr] = {
                      symbol: existing?.symbol ?? pair.quoteToken.symbol,
                      name: existing?.name ?? pair.quoteToken.name,
                      priceUsd: existing?.priceUsd ?? 0,
                      imageUrl: existing?.imageUrl,
                      liquidityUsd: liq,
                    };
                  }
                }
              }
            } catch {
              // skip failed batch, fall back to Blockscout data for these tokens
            }
          })
        );

        // ── Step 3: trending set from DexScreener token profiles ────────────
        const trendingSet = new Set<string>();
        try {
          const profileRes = await fetch(DEXSCREENER_PROFILES_URL);
          if (profileRes.ok) {
            const profiles = await profileRes.json();
            if (Array.isArray(profiles)) {
              for (const p of profiles) {
                if (p.chainId === DEXSCREENER_CHAIN && p.tokenAddress) {
                  trendingSet.add(p.tokenAddress.toLowerCase());
                }
              }
            }
          }
        } catch {
          // non-critical
        }

        // ── Step 4: merge — never drop a Blockscout-confirmed token ─────────
        const erc20Tokens: Token[] = candidates.map((c) => {
          const live = bestByAddr[c.address];
          return {
            symbol: live?.symbol || c.symbol,
            name: live?.name || c.name,
            address: c.address,
            decimals: c.decimals,
            icon: live?.imageUrl || c.icon || "/figmaAssets/image-7.png",
            price: live?.priceUsd || c.fallbackPrice || undefined,
            isTrending:
              trendingSet.has(c.address) ||
              (live?.liquidityUsd ?? 0) > 0 ||
              c.holders > 100,
          } as Token;
        });

        const wethPrice = bestByAddr[WETH_ADDRESS]?.priceUsd;

        const merged: Token[] = [
          {
            symbol: "ETH",
            name: "Ethereum",
            address: NATIVE_ETH_ADDRESS,
            decimals: 18,
            icon: ETH_ICON,
            isNative: true,
            price: wethPrice,
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
