import { useState, useEffect } from "react";

const WETH = "0x4200000000000000000000000000000000000006";
const NATIVE_ETH = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

function normalizeAddress(addr: string): string {
  return addr.toLowerCase() === NATIVE_ETH.toLowerCase() ? WETH : addr.toLowerCase();
}

export interface ChartPoint {
  time: number;
  price: number;
}

export type ChartRange = "1H" | "24H" | "7D";

const RANGE_CONFIG: Record<ChartRange, { interval: "minute" | "hour"; limit: number; minuteStep?: number }> = {
  "1H":  { interval: "minute", limit: 60,  minuteStep: 1 },
  "24H": { interval: "hour",   limit: 24 },
  "7D":  { interval: "hour",   limit: 168 },
};

async function findTopPool(tokenAddress: string): Promise<string | null> {
  const norm = normalizeAddress(tokenAddress);
  try {
    const res = await fetch(
      `https://api.geckoterminal.com/api/v2/networks/base/tokens/${norm}/pools?page=1`,
      { headers: { Accept: "application/json;version=20230302" } }
    );
    if (!res.ok) return null;
    const json = await res.json();
    const pools: any[] = json?.data ?? [];
    if (pools.length === 0) return null;
    // Return the pool with highest liquidity (first result, already sorted by GeckoTerminal)
    return pools[0]?.attributes?.address ?? null;
  } catch {
    return null;
  }
}

async function fetchOhlcv(poolAddress: string, range: ChartRange): Promise<ChartPoint[]> {
  const cfg = RANGE_CONFIG[range];
  let url = `https://api.geckoterminal.com/api/v2/networks/base/pools/${poolAddress}/ohlcv/${cfg.interval}?limit=${cfg.limit}`;
  if (cfg.minuteStep) url += `&aggregate=${cfg.minuteStep}`;

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json;version=20230302" },
    });
    if (!res.ok) return [];
    const json = await res.json();
    const raw: number[][] = json?.data?.attributes?.ohlcv_list ?? [];
    // raw = [timestamp, open, high, low, close, volume] — sorted newest first
    return raw
      .slice()
      .reverse()
      .map(([time, , , , close]) => ({ time: time * 1000, price: close }));
  } catch {
    return [];
  }
}

export function usePairChart(sellAddress: string, buyAddress: string, range: ChartRange) {
  const [data, setData] = useState<ChartPoint[]>([]);
  const [poolAddress, setPoolAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [change, setChange] = useState<number | null>(null);

  // Find pool when sell token changes
  useEffect(() => {
    let cancelled = false;
    setData([]);
    setChange(null);
    setPoolAddress(null);

    findTopPool(sellAddress).then((addr) => {
      if (!cancelled) setPoolAddress(addr);
    });

    return () => { cancelled = true; };
  }, [sellAddress]);

  // Fetch OHLCV when pool or range changes
  useEffect(() => {
    if (!poolAddress) return;
    let cancelled = false;
    setIsLoading(true);
    setData([]);

    fetchOhlcv(poolAddress, range).then((points) => {
      if (cancelled) return;
      setData(points);
      if (points.length >= 2) {
        const first = points[0].price;
        const last = points[points.length - 1].price;
        setChange(((last - first) / first) * 100);
      }
      setIsLoading(false);
    });

    return () => { cancelled = true; };
  }, [poolAddress, range]);

  return { data, isLoading, change, poolAddress };
}
