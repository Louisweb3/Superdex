import { useState, useEffect } from "react";

export interface TokenBalance {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  icon: string;
  balance: number;
  balanceUsd: number;
}

const ERC20_BALANCE_ABI = "0x70a08231"; // keccak("balanceOf(address)").slice(0,10)
const ZERO = "0".repeat(64);

function padAddress(addr: string): string {
  return addr.replace("0x", "").toLowerCase().padStart(64, "0");
}

function hexToBigInt(hex: string): bigint {
  return BigInt(hex);
}

async function fetchEthBalance(address: string): Promise<bigint> {
  if (!window.ethereum) return 0n;
  const balHex: string = await window.ethereum.request({
    method: "eth_getBalance",
    params: [address, "latest"],
  });
  return hexToBigInt(balHex);
}

async function fetchErc20Balance(tokenAddress: string, walletAddress: string): Promise<bigint> {
  if (!window.ethereum) return 0n;
  const data = ERC20_BALANCE_ABI + padAddress(walletAddress);
  try {
    const result: string = await window.ethereum.request({
      method: "eth_call",
      params: [{ to: tokenAddress, data }, "latest"],
    });
    return hexToBigInt(result);
  } catch {
    return 0n;
  }
}

// Static prices map for our known tokens on Base (fallback when no live feed)
const KNOWN_PRICES: Record<string, number> = {
  "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee": 2100, // ETH
  "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913": 1.0,   // USDC
  "0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf": 77350, // cbBTC
  "0x4200000000000000000000000000000000000006": 2100, // WETH
  "0x50c5725949a6f0c72e6c4a641f24049a917db0cb": 1.0,   // DAI
  "0xfde4c96c8593536e31f229ea8f37b2ada2699bb2": 1.0,   // USDT
};

export function useWalletBalances(
  walletAddress: string | null,
  tokens: { address: string; symbol: string; name: string; decimals: number; icon: string }[]
) {
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!walletAddress || !window.ethereum || tokens.length === 0) {
      setBalances([]);
      return;
    }
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      const results: TokenBalance[] = [];

      for (const t of tokens) {
        const isNative = t.address.toLowerCase() === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
        const raw = isNative
          ? await fetchEthBalance(walletAddress!)
          : await fetchErc20Balance(t.address, walletAddress!);

        const bal = Number(raw) / Math.pow(10, t.decimals);
        const price = KNOWN_PRICES[t.address.toLowerCase()] ?? 0;
        const balUsd = bal * price;

        results.push({
          address: t.address,
          symbol: t.symbol,
          name: t.name,
          decimals: t.decimals,
          icon: t.icon,
          balance: bal,
          balanceUsd: balUsd,
        });
      }

      // Sort by USD descending
      results.sort((a, b) => b.balanceUsd - a.balanceUsd);

      if (!cancelled) setBalances(results);
      if (!cancelled) setIsLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [walletAddress, tokens]);

  return { balances, isLoading };
}
