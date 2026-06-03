import { useState, useEffect, useRef } from "react";

export interface ChartPoint {
  time: number;
  price: number;
}

export type ChartRange = "1H" | "24H" | "7D";

export function usePairChart(sellAddress: string, _buyAddress: string, range: ChartRange) {
  const [data, setData] = useState<ChartPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [change, setChange] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!sellAddress) return;

    // Cancel any in-flight request
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setData([]);
    setChange(null);

    fetch(`/api/chart/${sellAddress.toLowerCase()}?range=${range}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((points: ChartPoint[]) => {
        setData(points);
        if (points.length >= 2) {
          const first = points[0].price;
          const last = points[points.length - 1].price;
          setChange(((last - first) / first) * 100);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        if (err?.name !== "AbortError") setIsLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [sellAddress, range]);

  return { data, isLoading, change };
}
