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
  price: string;           // buyToken per sellToken (calculated)
  estimatedPriceImpact: string;
  sources: SwapRoute[];
  totalNetworkFee: string; // in ETH (e.g. "0.000021")
  transaction?: {
    to: string;
    data: string;
    value: string;   // decimal wei string from 0x API
    gas: string;     // decimal gas limit string
    gasPrice: string;
  };
  issues?: {
    allowance?: { spender: string; currentAllowance: string; };
    balance?: { token: string; actual: string; expected: string; };
  };
  fees?: any;
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

    const sellAmountWei = parseAmount(sellAmountStr, sellToken.decimals);
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

      const resp = await fetch(`/api/swap/price?${params.toString()}`, {
        signal: abortRef.current.signal,
      });
      const data = await resp.json();

      if (!resp.ok) {
        setError(
          data.validationErrors?.[0]?.reason ??
          data.reason ??
          data.error ??
          "Failed to get price"
        );
        setQuote(null);
        return;
      }

      // Parse 0x v2 response — no `price` or `estimatedPriceImpact` fields
      const buyAmountFormatted = formatAmount(data.buyAmount ?? "0", buyToken.decimals);

      // Calculate price: how many buyToken per 1 sellToken
      const calculatedPrice =
        parseFloat(sellAmountStr) > 0 && parseFloat(buyAmountFormatted) > 0
          ? (parseFloat(buyAmountFormatted) / parseFloat(sellAmountStr)).toString()
          : "0";

      // Network fee: 0x v2 returns `totalNetworkFee` in wei (native ETH)
      const networkFeeEth = data.totalNetworkFee
        ? formatAmount(data.totalNetworkFee, 18)
        : "0";

      const sources: SwapRoute[] = (data.route?.fills ?? []).map((f: any) => ({
        name: f.source,
        proportion:
          (parseFloat(f.proportionBps ?? "10000") / 100).toFixed(0) + "%",
      }));

      setQuote({
        buyAmount: data.buyAmount ?? "0",
        buyAmountFormatted,
        minBuyAmount: data.minBuyAmount ?? "0",
        price: calculatedPrice,
        estimatedPriceImpact: "0",
        sources,
        totalNetworkFee: networkFeeEth,
        fees: data.fees,
        issues: data.issues,
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
  const sellAmountWei = parseAmount(sellAmountStr, sellToken.decimals);

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
    throw new Error(
      data.validationErrors?.[0]?.reason ??
      data.reason ??
      data.error ??
      "Failed to get quote"
    );
  }

  const buyAmountFormatted = formatAmount(data.buyAmount ?? "0", buyToken.decimals);

  const calculatedPrice =
    parseFloat(sellAmountStr) > 0 && parseFloat(buyAmountFormatted) > 0
      ? (parseFloat(buyAmountFormatted) / parseFloat(sellAmountStr)).toString()
      : "0";

  const networkFeeEth = data.totalNetworkFee
    ? formatAmount(data.totalNetworkFee, 18)
    : "0";

  const sources: SwapRoute[] = (data.route?.fills ?? []).map((f: any) => ({
    name: f.source,
    proportion:
      (parseFloat(f.proportionBps ?? "10000") / 100).toFixed(0) + "%",
  }));

  return {
    buyAmount: data.buyAmount ?? "0",
    buyAmountFormatted,
    minBuyAmount: data.minBuyAmount ?? "0",
    price: calculatedPrice,
    estimatedPriceImpact: "0",
    sources,
    totalNetworkFee: networkFeeEth,
    transaction: data.transaction,   // decimal strings from 0x — converted to hex in handleSwap
    issues: data.issues,
    fees: data.fees,
    rawQuote: data,
  };
}
