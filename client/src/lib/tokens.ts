export interface Token {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  icon: string;
  isNative?: boolean;

  // portfolio / market enrichments
  price?: number;
  balance?: number;
  balanceUsd?: number;
  isTrending?: boolean;
}

export const BASE_CHAIN_ID = 8453;
export const BASE_CHAIN_HEX = "0x2105";

export const RH_CHAIN_ID = 4663;
export const RH_CHAIN_HEX = "0x1237";

export const NATIVE_ETH_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

// Robinhood Chain has no indexed token database (DexScreener etc. don't cover it yet),
// so we start users with native ETH and let them paste any ERC-20 address to add it.
export const RH_TOKENS: Token[] = [
  {
    symbol: "ETH",
    name: "Ethereum",
    address: NATIVE_ETH_ADDRESS,
    decimals: 18,
    icon: "/figmaAssets/image-7.png",
    isNative: true,
  },
];

export const TOKENS: Token[] = [
  {
    symbol: "ETH",
    name: "Ethereum",
    address: NATIVE_ETH_ADDRESS,
    decimals: 18,
    icon: "/figmaAssets/image-7.png",
    isNative: true,
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    decimals: 6,
    icon: "/figmaAssets/image-5.png",
  },
  {
    symbol: "cbBTC",
    name: "Coinbase Bitcoin",
    address: "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
    decimals: 8,
    icon: "/figmaAssets/image-6.png",
  },
  {
    symbol: "WETH",
    name: "Wrapped Ether",
    address: "0x4200000000000000000000000000000000000006",
    decimals: 18,
    icon: "/figmaAssets/image-7.png",
  },
  {
    symbol: "DAI",
    name: "Dai Stablecoin",
    address: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",
    decimals: 18,
    icon: "/figmaAssets/image-5.png",
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    address: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2",
    decimals: 6,
    icon: "/figmaAssets/image-5.png",
  },
];

export interface DexSource {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export const DEX_SOURCES: DexSource[] = [
  { id: "UniswapV3", name: "Uniswap V3", icon: "/figmaAssets/image-21.png", color: "#ff007a" },
  { id: "AerodromeV2", name: "Aerodrome", icon: "/figmaAssets/image-17.png", color: "#1f6bff" },
  { id: "AerodromeSS", name: "Aerodrome SS", icon: "/figmaAssets/image-17.png", color: "#1f6bff" },
  { id: "PancakeSwap_V3", name: "PancakeSwap", icon: "/figmaAssets/image-19.png", color: "#ff9c00" },
  { id: "SushiSwap", name: "SushiSwap", icon: "/figmaAssets/image-21.png", color: "#fa52a0" },
  { id: "BaseSwap_V3", name: "BaseSwap", icon: "/figmaAssets/image-15.png", color: "#1f6bff" },
  { id: "Balancer_V2", name: "Balancer", icon: "/figmaAssets/image-21.png", color: "#1e1e3f" },
  { id: "Curve", name: "Curve", icon: "/figmaAssets/image-21.png", color: "#d9e1f2" },
];

export function formatAmount(amount: string, decimals: number): string {
  try {
    if (!amount || amount === "0") return "0";
    const amtStr = amount.replace(/^0+/, "") || "0";
    if (amtStr.length <= decimals) {
      const frac = amtStr.padStart(decimals, "0").replace(/0+$/, "");
      return frac ? `0.${frac}` : "0";
    }
    const whole = amtStr.slice(0, amtStr.length - decimals);
    const frac = amtStr.slice(amtStr.length - decimals).replace(/0+$/, "");
    return frac ? `${whole}.${frac}` : whole;
  } catch {
    return "0";
  }
}

export function parseAmount(amount: string, decimals: number): string {
  try {
    if (!amount || isNaN(parseFloat(amount))) return "0";
    const [whole, frac = ""] = amount.split(".");
    const fracPadded = frac.slice(0, decimals).padEnd(decimals, "0");
    const combined = (whole || "0") + fracPadded;
    return combined.replace(/^0+/, "") || "0";
  } catch {
    return "0";
  }
}

export function decimalToHex(dec: string): string {
  // Convert decimal string to hex string without BigInt (safe for large uint256 values)
  if (!dec || dec === "0") return "0";
  if (dec.startsWith("0x") || dec.startsWith("0X")) return dec.slice(2) || "0";
  let num = dec.replace(/^0+/, "") || "0";
  if (num === "0") return "0";
  let hex = "";
  const digits = num.split("").map(Number);
  while (digits.some((d) => d > 0)) {
    let rem = 0;
    for (let i = 0; i < digits.length; i++) {
      const cur = rem * 10 + digits[i];
      digits[i] = Math.floor(cur / 16);
      rem = cur % 16;
    }
    hex = rem.toString(16) + hex;
  }
  return hex || "0";
}

// Convert a decimal wei string to 0x-prefixed hex (required by eth_sendTransaction)
export function toHexWei(dec: string | undefined): string {
  if (!dec || dec === "0") return "0x0";
  if (dec.startsWith("0x") || dec.startsWith("0X")) return dec;
  return "0x" + decimalToHex(dec);
}

export const RH_RPC_URL = "https://rpc.mainnet.chain.robinhood.com";

// Minimal JSON-RPC eth_call helper — used to look up ERC-20 metadata for
// custom tokens pasted in on Robinhood Chain, independent of wallet state.
async function rpcEthCall(rpcUrl: string, to: string, data: string): Promise<string | null> {
  try {
    const res = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_call",
        params: [{ to, data }, "latest"],
      }),
    });
    const json = await res.json();
    return json?.result ?? null;
  } catch {
    return null;
  }
}

function decodeAbiString(hex: string | null): string {
  if (!hex || hex === "0x") return "";
  const clean = hex.slice(2);
  // dynamic string: [offset(32B)][length(32B)][data]
  if (clean.length > 128) {
    const lenHex = clean.slice(64, 128);
    const len = parseInt(lenHex, 16);
    const dataHex = clean.slice(128, 128 + len * 2);
    try {
      const bytes = dataHex.match(/.{1,2}/g)?.map((b) => parseInt(b, 16)) ?? [];
      return new TextDecoder().decode(new Uint8Array(bytes));
    } catch {
      return "";
    }
  }
  // some tokens (e.g. bytes32 symbol) return fixed 32 bytes instead
  try {
    const bytes = clean.match(/.{1,2}/g)?.map((b) => parseInt(b, 16)) ?? [];
    return new TextDecoder().decode(new Uint8Array(bytes)).replace(/\0/g, "").trim();
  } catch {
    return "";
  }
}

export async function fetchErc20TokenMeta(
  address: string,
  rpcUrl: string = RH_RPC_URL
): Promise<{ symbol: string; name: string; decimals: number } | null> {
  try {
    const [symbolHex, nameHex, decimalsHex] = await Promise.all([
      rpcEthCall(rpcUrl, address, "0x95d89b41"), // symbol()
      rpcEthCall(rpcUrl, address, "0x06fdde03"), // name()
      rpcEthCall(rpcUrl, address, "0x313ce567"), // decimals()
    ]);
    const symbol = decodeAbiString(symbolHex) || "TOKEN";
    const name = decodeAbiString(nameHex) || symbol;
    const decimals = decimalsHex ? parseInt(decimalsHex, 16) : 18;
    if (!decimalsHex && !symbolHex && !nameHex) return null;
    return { symbol, name, decimals: isNaN(decimals) ? 18 : decimals };
  } catch {
    return null;
  }
}

export function encodeApprove(spender: string, amount: string): string {
  const sig = "095ea7b3";
  const paddedSpender = spender.replace("0x", "").toLowerCase().padStart(64, "0");
  const paddedAmount = decimalToHex(amount).padStart(64, "0");
  return `0x${sig}${paddedSpender}${paddedAmount}`;
}
