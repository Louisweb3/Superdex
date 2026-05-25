import { useState, useEffect } from "react";
import type { Token } from "@/lib/tokens";

// 30 popular Base chain tokens
export const BASE_TOKEN_LIST: Array<{
  address: string;
  decimals: number;
  isNative?: boolean;
  fallbackSymbol?: string;
  fallbackName?: string;
}> = [
  { address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", decimals: 18, isNative: true, fallbackSymbol: "ETH", fallbackName: "Ethereum" },
  { address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", decimals: 6,  fallbackSymbol: "USDC",  fallbackName: "USD Coin" },
  { address: "0x4200000000000000000000000000000000000006", decimals: 18, fallbackSymbol: "WETH",  fallbackName: "Wrapped Ether" },
  { address: "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf", decimals: 8,  fallbackSymbol: "cbBTC", fallbackName: "Coinbase Bitcoin" },
  { address: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb", decimals: 18, fallbackSymbol: "DAI",   fallbackName: "Dai Stablecoin" },
  { address: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2", decimals: 6,  fallbackSymbol: "USDT",  fallbackName: "Tether USD" },
  { address: "0x940181a94A35A4569E4529A3CDfB74e38FD98631", decimals: 18, fallbackSymbol: "AERO",  fallbackName: "Aerodrome Finance" },
  { address: "0x532f27101965dd16442E59d40670FaF5eBB142E4", decimals: 18, fallbackSymbol: "BRETT", fallbackName: "Brett" },
  { address: "0xAC1Bd2486aAf3B5C0fc3Fd868558b082a531B2B4", decimals: 18, fallbackSymbol: "TOSHI", fallbackName: "Toshi" },
  { address: "0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed", decimals: 18, fallbackSymbol: "DEGEN", fallbackName: "Degen" },
  { address: "0x0b3e328455c4059EEb9e3f84b5543F74E24e7E1b", decimals: 18, fallbackSymbol: "VIRTUAL", fallbackName: "Virtuals Protocol" },
  { address: "0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22", decimals: 18, fallbackSymbol: "cbETH", fallbackName: "Coinbase Staked ETH" },
  { address: "0xB6fe221Fe9EeF5aBa221c348bA20A1Bf5e73624c", decimals: 18, fallbackSymbol: "rETH",  fallbackName: "Rocket Pool ETH" },
  { address: "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA", decimals: 6,  fallbackSymbol: "USDbC", fallbackName: "USD Base Coin" },
  { address: "0xA88594D404727625A9437C3f886C7643872296AE", decimals: 18, fallbackSymbol: "WELL",  fallbackName: "Moonwell" },
  { address: "0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85", decimals: 18, fallbackSymbol: "SEAM",  fallbackName: "Seamless Protocol" },
  { address: "0xfA980cEd6895AC314E7dE34Ef1bFAE90a5AdF97c", decimals: 18, fallbackSymbol: "PRIME", fallbackName: "Echelon Prime" },
  { address: "0x2Da56AcB9Ea78330f947bD57C54119Debda7AF71", decimals: 18, fallbackSymbol: "MOG",   fallbackName: "Mog Coin" },
  { address: "0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452", decimals: 18, fallbackSymbol: "wstETH", fallbackName: "Wrapped stETH" },
  { address: "0x04C0599Ae5A44757c0af6F9eC3b93da8976c150A", decimals: 18, fallbackSymbol: "weETH", fallbackName: "Wrapped eETH" },
  { address: "0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42", decimals: 6,  fallbackSymbol: "EURC",  fallbackName: "Euro Coin" },
  { address: "0xd07379a755A8f11B57610154861D694b2A0f615a", decimals: 18, fallbackSymbol: "TYBG",  fallbackName: "Thank You Based God" },
  { address: "0x703D57164CA270b0B330A87FD159CfEF1490c0a5", decimals: 18, fallbackSymbol: "NORMIE", fallbackName: "Normie" },
  { address: "0xB1a03EdA10342529bBF8EB700a06C60441fEf25d", decimals: 18, fallbackSymbol: "MIGGLES", fallbackName: "Miggles" },
  { address: "0x4158734D47Fc9b5b6d9893F93579DA39C4E48A0d", decimals: 18, fallbackSymbol: "BSWAP", fallbackName: "BaseSwap Token" },
  { address: "0xfF0C532FDB8Cd566Ae169C1CB157ff2Bdc83E105", decimals: 18, fallbackSymbol: "DOLA",  fallbackName: "DOLA" },
  { address: "0xeb466342C4d449BC9f53A865D5Cb90586f405215", decimals: 6,  fallbackSymbol: "axlUSDC", fallbackName: "Axelar USDC" },
  { address: "0x236aa50979D5f3De3Bd1Eeb40E81137F22ab794b", decimals: 18, fallbackSymbol: "tBTC",  fallbackName: "tBTC v2" },
  { address: "0x4F604735c1cF31399C6E711D5962b2B3E0225AD3", decimals: 18, fallbackSymbol: "USDGLO", fallbackName: "Glo Dollar" },
  { address: "0xCfA3Ef56d303AE4fAabA0592388F19d7C3399FB4", decimals: 18, fallbackSymbol: "BGCI",  fallbackName: "Base Global Crypto Index" },
];

// Reliable icon resolution priority: TrustWallet → DexScreener CDN → placeholder
function tokenIcon(address: string, isNative?: boolean): string {
  if (isNative) {
    return "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png";
  }
  // Use DexScreener CDN — this works for most popular tokens
  return `https://dd.dexscreener.com/ds-data/tokens/base/${address.toLowerCase()}.png`;
}

// Per-symbol known icon overrides (CoinGecko CDN / TrustWallet)
const ICON_OVERRIDES: Record<string, string> = {
  ETH:   "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png",
  WETH:  "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png",
  USDC:  "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png",
  USDT:  "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png",
  DAI:   "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png",
  cbBTC: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/assets/0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf/logo.png",
  cbETH: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/assets/0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22/logo.png",
  wstETH:"https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/assets/0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452/logo.png",
  rETH:  "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/assets/0xB6fe221Fe9EeF5aBa221c348bA20A1Bf5e73624c/logo.png",
  AERO:  "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/assets/0x940181a94A35A4569E4529A3CDfB74e38FD98631/logo.png",
  BRETT: "https://dd.dexscreener.com/ds-data/tokens/base/0x532f27101965dd16442e59d40670faf5ebb142e4.png",
  DEGEN: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/assets/0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed/logo.png",
  EURC:  "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/assets/0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42/logo.png",
  USDbC: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/assets/0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA/logo.png",
};

export function useBaseTokens() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);

      try {
        // ── Step 1: Build initial list from known fallbacks immediately ────────
        const initialTokens: Token[] = BASE_TOKEN_LIST.map((t) => ({
          address: t.address,
          symbol: t.fallbackSymbol ?? "???",
          name: t.fallbackName ?? "Unknown",
          decimals: t.decimals,
          isNative: t.isNative,
          icon:
            ICON_OVERRIDES[t.fallbackSymbol ?? ""] ??
            tokenIcon(t.address, t.isNative),
          isTrending: false,
        }));
        if (!cancelled) setTokens(initialTokens);

        // ── Step 2: Fetch live token data from DexScreener bulk pairs ─────────
        const erc20Addrs = BASE_TOKEN_LIST.filter((t) => !t.isNative)
          .map((t) => t.address.toLowerCase());

        // DexScreener /tokens/v1/{chainId}/{addresses} returns pairs for those tokens
        const pairsRes = await fetch(
          `https://api.dexscreener.com/tokens/v1/base/${erc20Addrs.join(",")}`
        );

        if (pairsRes.ok) {
          const pairs: any[] = await pairsRes.json();
          // Build best pair per token: highest liquidity
          const bestByAddr: Record<string, { symbol: string; name: string; priceUsd: number; imageUrl?: string }> = {};
          for (const pair of pairs) {
            const addr = pair.baseToken?.address?.toLowerCase();
            if (!addr) continue;
            const priceUsd = parseFloat(pair.priceUsd ?? "0") || 0;
            const liq = pair.liquidity?.usd ?? 0;
            const existing = bestByAddr[addr];
            if (!existing || liq > (bestByAddr[addr] as any)._liq) {
              bestByAddr[addr] = {
                symbol: pair.baseToken.symbol,
                name: pair.baseToken.name,
                priceUsd,
                imageUrl: pair.info?.imageUrl,
                _liq: liq,
              } as any;
            }
          }

          // ── Step 3: Fetch trending Base addresses from profiles ─────────────
          const trendingSet = new Set<string>();
          try {
            const profileRes = await fetch("https://api.dexscreener.com/token-profiles/latest/v1");
            if (profileRes.ok) {
              const profiles = await profileRes.json();
              if (Array.isArray(profiles)) {
                for (const p of profiles) {
                  if (p.chainId === "base" && p.tokenAddress) {
                    trendingSet.add(p.tokenAddress.toLowerCase());
                  }
                }
              }
            }
          } catch {
            // non-critical
          }

          // ── Step 4: Merge live data into token list ─────────────────────────
          const enriched: Token[] = BASE_TOKEN_LIST.map((t) => {
            if (t.isNative) {
              return {
                address: t.address,
                symbol: "ETH",
                name: "Ethereum",
                decimals: 18,
                isNative: true,
                icon: ICON_OVERRIDES["ETH"],
                isTrending: trendingSet.has(t.address.toLowerCase()),
              };
            }
            const addrLow = t.address.toLowerCase();
            const live = bestByAddr[addrLow];
            const sym = live?.symbol ?? t.fallbackSymbol ?? "???";
            return {
              address: t.address,
              symbol: sym,
              name: live?.name ?? t.fallbackName ?? "Unknown",
              decimals: t.decimals,
              icon: live?.imageUrl || ICON_OVERRIDES[sym] || tokenIcon(addrLow),
              isTrending: trendingSet.has(addrLow),
              price: live?.priceUsd,
            };
          });

          if (!cancelled) setTokens(enriched);
        }
      } catch (e) {
        console.error("useBaseTokens error:", e);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return { tokens, isLoading };
}
