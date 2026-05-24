import { useState, useEffect, useRef, useCallback } from "react";
import { type Token, parseAmount, formatAmount } from "@/lib/tokens";

export interface SwapRoute {
  name: string;
  proportion: string;
}

export interface SwapQuote {
  buyAmount: string;
  buyAmountFormatted: string;
  minBuyAmount: string;
  price: string;           // buyToken per sellToken
  estimatedPriceImpact: string;
  sources: SwapRoute[];
  totalNetworkFeeUsd: string;
  transaction?: {
    to: string;
    data: string;
    value: string;
    gas: string;
    gasPrice: string;
  };
  issues?: {
    allowance?: { spender: string; currentAllowance: string; };
    balance?: { token: string; currentBalance: string; expectedBalance: string };
  };
  fees?: { zeroExFee?: { billingType: string; feeAmount: string; feeToken: string; } };
  rawQuote?: any;
}

export function useSwapPrice(
  sellToken: Token | null,
  buyToken: Token | null,
  sellAmountStr: string,
  slippageBps: number,
  selectedSources: string[]
) {
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchPrice = useCallback(async () => {
    if (!sellToken || !buyToken || !sellAmountStr || parseFloat(sellAmountStr) <= 0) {
      setQuote(null);
      setError(null);
      return;
    }

    const sellAmountWei = parseAmount(sellAmountStr, sellToken.decimals).toString();
    if (sellAmountWei === "0") return;

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        sellToken: sellToken.address,
        buyToken: buyToken.address,
        sellAmount: sellAmountWei,
        slippageBps: String(slippageBps),
      });
      if (selectedSources.length > 0) {
        params.set("includedSources", selectedSources.join(","));
      }

      const resp = await fetch(`/api/swap/price?${params.toString()}`, { signal: abortRef.current.signal });
      const data = await resp.json();

      if (!resp.ok) {
        setError(data.validationErrors?.[0]?.reason ?? data.reason ?? data.error ?? "Failed to get price");
        setQuote(null);
        return;
      }

      const buyAmountFormatted = formatAmount(data.buyAmount, buyToken.decimals);
      const sources: SwapRoute[] = (data.route?.fills ?? []).map((f: any) => ({
        name: f.source,
        proportion: (parseFloat(f.proportionBps ?? "10000") / 100).toFixed(0) + "%",
      }));

      setQuote({
        buyAmount: data.buyAmount,
        buyAmountFormatted,
        minBuyAmount: data.minBuyAmount ?? "0",
        price: data.price ?? "0",
        estimatedPriceImpact: data.estimatedPriceImpact ?? "0",
        sources,
        totalNetworkFeeUsd: data.totalNetworkFeeUsd ?? "0",
        fees: data.fees,
        rawQuote: data,
      });
    } catch (err: any) {
      if (err.name === "AbortError") return;
      setError(err.message ?? "Network error");
      setQuote(null);
    } finally {
      setIsLoading(false);
    }
  }, [sellToken, buyToken, sellAmountStr, slippageBps, selectedSources]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchPrice, 600);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [fetchPrice]);

  return { quote, isLoading, error, refetch: fetchPrice };
}

export async function fetchSwapQuote(
  sellToken: Token,
  buyToken: Token,
  sellAmountStr: string,
  taker: string,
  slippageBps: number,
  selectedSources: string[]
): Promise<SwapQuote> {
  const sellAmountWei = parseAmount(sellAmountStr, sellToken.decimals).toString();

  const params = new URLSearchParams({
    sellToken: sellToken.address,
    buyToken: buyToken.address,
    sellAmount: sellAmountWei,
    taker,
    slippageBps: String(slippageBps),
  });
  if (selectedSources.length > 0) {
    params.set("includedSources", selectedSources.join(","));
  }

  const resp = await fetch(`/api/swap/quote?${params.toString()}`);
  const data = await resp.json();

  if (!resp.ok) {
    throw new Error(data.validationErrors?.[0]?.reason ?? data.reason ?? data.error ?? "Failed to get quote");
  }

  const buyAmountFormatted = formatAmount(data.buyAmount, buyToken.decimals);
  const sources: SwapRoute[] = (data.route?.fills ?? []).map((f: any) => ({
    name: f.source,
    proportion: (parseFloat(f.proportionBps ?? "10000") / 100).toFixed(0) + "%",
  }));

  return {
    buyAmount: data.buyAmount,
    buyAmountFormatted,
    minBuyAmount: data.minBuyAmount ?? "0",
    price: data.price ?? "0",
    estimatedPriceImpact: data.estimatedPriceImpact ?? "0",
    sources,
    totalNetworkFeeUsd: data.totalNetworkFeeUsd ?? "0",
    transaction: data.transaction,
    issues: data.issues,
    fees: data.fees,
    rawQuote: data,
  };
}
