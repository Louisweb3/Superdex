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
  price: string;
  estimatedPriceImpact: string;
  sources: SwapRoute[];
  totalNetworkFee: string;

  transaction?: {
    to: string;
    data: string;
    value: string;
    gas: string;
    gasPrice: string;
  };

  issues?: {
    allowance?: {
      spender: string;
      currentAllowance: string;
    };

    balance?: {
      token: string;
      actual: string;
      expected: string;
    };
  };

  fees?: any;
  rawQuote?: any;
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function buildSources(fills: any[] = []): SwapRoute[] {
  const map = new Map<string, number>();

  for (const fill of fills) {
    const source = fill.source || "Unknown";
    const bps = parseFloat(fill.proportionBps || "0");

    map.set(source, (map.get(source) || 0) + bps);
  }

  return Array.from(map.entries()).map(([name, bps]) => ({
    name,
    proportion: `${(bps / 100).toFixed(0)}%`,
  }));
}

function calculatePrice(
  sellAmount: string,
  buyAmountFormatted: string
) {
  const sell = parseFloat(sellAmount || "0");
  const buy = parseFloat(buyAmountFormatted || "0");

  if (!sell || !buy) return "0";

  return (buy / sell).toString();
}

function calculatePriceImpact(data: any): string {
  try {
    if (!data?.tokenMetadata) return "0";

    const buyTax =
      parseFloat(
        data.tokenMetadata?.buyToken?.buyTaxBps || "0"
      ) / 100;

    const sellTax =
      parseFloat(
        data.tokenMetadata?.sellToken?.sellTaxBps || "0"
      ) / 100;

    const impact =
      parseFloat(data.estimatedPriceImpact || "0") +
      buyTax +
      sellTax;

    return impact.toFixed(2);
  } catch {
    return "0";
  }
}

function parseNetworkFee(totalNetworkFee?: string) {
  if (!totalNetworkFee) return "0";

  return formatAmount(totalNetworkFee, 18);
}

// ─────────────────────────────────────────────────────────────
// useSwapPrice Hook
// ─────────────────────────────────────────────────────────────

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
    if (
      !sellToken ||
      !buyToken ||
      !sellAmountStr ||
      parseFloat(sellAmountStr) <= 0
    ) {
      setQuote(null);
      setError(null);
      return;
    }

    try {
      const sellAmountWei = parseAmount(
        sellAmountStr,
        sellToken.decimals
      );

      if (sellAmountWei === "0") {
        setQuote(null);
        return;
      }

      // cancel previous request
      if (abortRef.current) {
        abortRef.current.abort();
      }

      const controller = new AbortController();
      abortRef.current = controller;

      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        sellToken: sellToken.address,
        buyToken: buyToken.address,
        sellAmount: sellAmountWei,
        slippageBps: String(slippageBps),
      });

      if (selectedSources.length > 0) {
        params.set(
          "includedSources",
          selectedSources.join(",")
        );
      }

      const resp = await fetch(
        `/api/swap/price?${params.toString()}`,
        {
          signal: controller.signal,
        }
      );

      const data = await resp.json();

      if (!resp.ok) {
        throw new Error(
          data.validationErrors?.[0]?.reason ||
            data.reason ||
            data.error ||
            "Failed to get price"
        );
      }

      const buyAmountFormatted = formatAmount(
        data.buyAmount || "0",
        buyToken.decimals
      );

      const parsedQuote: SwapQuote = {
        buyAmount: data.buyAmount || "0",

        buyAmountFormatted,

        minBuyAmount: data.minBuyAmount || "0",

        price: calculatePrice(
          sellAmountStr,
          buyAmountFormatted
        ),

        estimatedPriceImpact:
          calculatePriceImpact(data),

        sources: buildSources(
          data.route?.fills || []
        ),

        totalNetworkFee: parseNetworkFee(
          data.totalNetworkFee
        ),

        fees: data.fees,

        issues: data.issues,

        rawQuote: data,
      };

      setQuote(parsedQuote);
      setError(null);
    } catch (err: any) {
      if (err.name === "AbortError") return;

      setQuote(null);

      setError(
        err?.message || "Failed to fetch quote"
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    sellToken,
    buyToken,
    sellAmountStr,
    slippageBps,
    selectedSources,
  ]);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchPrice();
    }, 350);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [fetchPrice]);

  return {
    quote,
    isLoading,
    error,
    refetch: fetchPrice,
  };
}

// ─────────────────────────────────────────────────────────────
// Full Swap Quote
// ─────────────────────────────────────────────────────────────

export async function fetchSwapQuote(
  sellToken: Token,
  buyToken: Token,
  sellAmountStr: string,
  taker: string,
  slippageBps: number,
  selectedSources: string[]
): Promise<SwapQuote> {
  const sellAmountWei = parseAmount(
    sellAmountStr,
    sellToken.decimals
  );

  const params = new URLSearchParams({
    sellToken: sellToken.address,
    buyToken: buyToken.address,
    sellAmount: sellAmountWei,
    taker,
    slippageBps: String(slippageBps),
  });

  if (selectedSources.length > 0) {
    params.set(
      "includedSources",
      selectedSources.join(",")
    );
  }

  const resp = await fetch(
    `/api/swap/quote?${params.toString()}`
  );

  const data = await resp.json();

  if (!resp.ok) {
    throw new Error(
      data.validationErrors?.[0]?.reason ||
        data.reason ||
        data.error ||
        "Failed to get quote"
    );
  }

  const buyAmountFormatted = formatAmount(
    data.buyAmount || "0",
    buyToken.decimals
  );

  return {
    buyAmount: data.buyAmount || "0",

    buyAmountFormatted,

    minBuyAmount: data.minBuyAmount || "0",

    price: calculatePrice(
      sellAmountStr,
      buyAmountFormatted
    ),

    estimatedPriceImpact:
      calculatePriceImpact(data),

    sources: buildSources(
      data.route?.fills || []
    ),

    totalNetworkFee: parseNetworkFee(
      data.totalNetworkFee
    ),

    transaction: data.transaction
      ? {
          to: data.transaction.to,
          data: data.transaction.data,
          value: data.transaction.value,
          gas: data.transaction.gas,
          gasPrice: data.transaction.gasPrice,
        }
      : undefined,

    issues: data.issues,

    fees: data.fees,

    rawQuote: data,
  };
}