import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import {
  Settings, ChevronDown, ArrowUpDown, ChevronRight,
  Info, Zap, CheckSquare, Square, Loader2, ExternalLink, X, AlertTriangle,
  Search, TrendingUp, Wallet
} from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, Tooltip, YAxis } from "recharts";
import { TOKENS, DEX_SOURCES, type Token, parseAmount, encodeApprove, NATIVE_ETH_ADDRESS, toHexWei } from "@/lib/tokens";
import { useWalletContext } from "@/context/WalletContext";
import { useSwapPrice, fetchSwapQuote, type SwapQuote } from "@/hooks/useSwapQuote";
import { recordSwapReward, useMarketPrices, type MarketPrice } from "@/hooks/useRewards";
import { useBaseTokens } from "@/hooks/useBaseTokens";
import { useWalletBalances } from "@/hooks/useWalletBalances";
import { usePairChart, type ChartRange } from "@/hooks/usePairChart";
import maximizeRewardsBg from "@assets/Background__1779712623898.png";
import tokenLogo from "@assets/token_logo_1779712623899.png";

const SLIPPAGE_OPTIONS = ["0.1", "0.5", "1.0"];
const NATIVE_ETH_ADDR_LOWER = NATIVE_ETH_ADDRESS.toLowerCase();

function fmtUsd(n: number) {
  if (!n || isNaN(n)) return "$0.00";
  if (n >= 1000) return "$" + (n / 1000).toFixed(2) + "k";
  return "$" + n.toFixed(4);
}

// ─── Token Picker Modal (fixed position — bypasses all overflow clipping) ─────
function TokenPickerModal({
  tokens,
  selected,
  onSelect,
  onClose,
}: {
  tokens: Token[];
  selected: Token;
  onSelect: (t: Token) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return tokens;
    return tokens.filter(
      (t) =>
        t.symbol.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q) ||
        t.address.toLowerCase().includes(q)
    );
  }, [tokens, search]);

  const holdings = useMemo(
    () =>
      filtered
        .filter((t) => t.balance !== undefined && t.balance > 0)
        .sort((a, b) => (b.balanceUsd ?? 0) - (a.balanceUsd ?? 0)),
    [filtered]
  );
  const trendingList = useMemo(
    () =>
      filtered.filter(
        (t) => t.isTrending && !holdings.some((h) => h.address === t.address)
      ),
    [filtered, holdings]
  );
  const allOthers = useMemo(
    () =>
      filtered.filter(
        (t) =>
          !holdings.some((h) => h.address === t.address) &&
          !t.isTrending
      ),
    [filtered, holdings]
  );

  function TokenRow({ t }: { t: Token }) {
    const isSelected = t.address.toLowerCase() === selected.address.toLowerCase();
    return (
      <button
        onClick={() => { onSelect(t); onClose(); }}
        className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-[#0a1e30] ${
          isSelected ? "bg-[#0c2030]" : ""
        }`}
        data-testid={`token-option-${t.symbol}`}
      >
        <img
          src={t.icon}
          alt={t.symbol}
          className="h-9 w-9 shrink-0 rounded-full object-cover bg-[#0a1825]"
          onError={(e) => {
            const img = e.target as HTMLImageElement;
            img.onerror = null;
            img.src = `https://dd.dexscreener.com/ds-data/tokens/base/${t.address.toLowerCase()}.png`;
          }}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-['Inter',sans-serif] text-[14px] font-bold text-[#c8ccd2]">
              {t.symbol}
            </span>
            {t.isTrending && (
              <span className="rounded-[4px] bg-[#0e2a0a] px-1.5 py-0.5 text-[9px] font-bold text-[#3acd5b]">
                HOT
              </span>
            )}
            {isSelected && (
              <div className="h-1.5 w-1.5 rounded-full bg-[#2dae50]" />
            )}
          </div>
          <span className="font-['Inter',sans-serif] text-[12px] text-[#3a4a5c] truncate">
            {t.name}
          </span>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-0.5">
          {t.balance !== undefined && t.balance > 0 && (
            <span className="font-['Inter',sans-serif] text-[12px] font-medium text-[#9da1a8]">
              {t.balance.toLocaleString("en-US", { maximumFractionDigits: 5 })}
            </span>
          )}
          {t.balanceUsd !== undefined && t.balanceUsd > 0.005 && (
            <span className="font-['Inter',sans-serif] text-[11px] text-[#3a4a5c]">
              ${t.balanceUsd.toLocaleString("en-US", { maximumFractionDigits: 2 })}
            </span>
          )}
          {t.price !== undefined && t.price > 0 && !(t.balance !== undefined && t.balance > 0) && (
            <span className="font-['Inter',sans-serif] text-[11px] text-[#3a4a5c]">
              ${t.price < 0.01
                ? t.price.toExponential(2)
                : t.price.toLocaleString("en-US", { maximumFractionDigits: 4 })}
            </span>
          )}
        </div>
      </button>
    );
  }

  function SectionLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-[#020c18]">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#3a4a5c]">
          {label}
        </span>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[400px] overflow-hidden rounded-[20px] border border-[#0f2030] bg-[#020c18] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#0d1e2e] px-5 py-3.5">
          <span className="font-['Inter',sans-serif] text-[14px] font-bold text-[#7a8494]">
            Select Token — Base
          </span>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full text-[#3a4a5c] transition-colors hover:bg-[#0a1825] hover:text-[#7a8494]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        <div className="border-b border-[#0d1e2e] px-4 py-2.5">
          <div className="flex items-center gap-2.5 rounded-[10px] border border-[#0f2030] bg-[#040e1e] px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-[#3a4a5c]" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or paste address"
              className="w-full bg-transparent font-['Inter',sans-serif] text-[13px] text-[#c8ccd4] outline-none placeholder:text-[#2a3a4c]"
              data-testid="token-search-input"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-[#3a4a5c] hover:text-[#7a8494]">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Token list */}
        <div className="max-h-[480px] overflow-y-auto">
          {/* Your Holdings */}
          {holdings.length > 0 && (
            <>
              <SectionLabel
                icon={<Wallet className="h-3 w-3 text-[#2dae50]" />}
                label="Your Holdings"
              />
              {holdings.map((t) => <TokenRow key={t.address} t={t} />)}
            </>
          )}

          {/* Trending */}
          {trendingList.length > 0 && (
            <>
              <SectionLabel
                icon={<TrendingUp className="h-3 w-3 text-[#f5a623]" />}
                label="Trending on Base"
              />
              {trendingList.map((t) => <TokenRow key={t.address} t={t} />)}
            </>
          )}

          {/* All Tokens */}
          {allOthers.length > 0 && (
            <>
              <SectionLabel
                icon={<Search className="h-3 w-3 text-[#3a4a5c]" />}
                label="All Tokens"
              />
              {allOthers.map((t) => <TokenRow key={t.address} t={t} />)}
            </>
          )}

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10">
              <Search className="h-8 w-8 text-[#1a2a3c] mb-2" />
              <p className="font-['Inter',sans-serif] text-[13px] text-[#3a4a5c]">No tokens found</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[#0d1e2e] px-4 py-2.5">
          <p className="text-center font-['Inter',sans-serif] text-[10px] text-[#2a3a4c]">
            Showing Base chain tokens only · Data from DexScreener
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Token Input Box ────────────────────────────────────────────────────────────
function TokenBox({
  label, token, amount, onAmountChange, readonly, usdValue,
  allTokens, onTokenChange, disabledToken,
}: {
  label: string;
  token: Token;
  amount: string;
  onAmountChange?: (v: string) => void;
  readonly?: boolean;
  usdValue: string;
  allTokens: Token[];
  onTokenChange: (t: Token) => void;
  disabledToken: Token;
}) {
  const [open, setOpen] = useState(false);
  const available = allTokens.filter(
    (t) => t.address.toLowerCase() !== disabledToken.address.toLowerCase()
  );

  // Find this token's balance from allTokens enrichment
  const tokenWithBalance = allTokens.find(
    (t) => t.address.toLowerCase() === token.address.toLowerCase()
  );
  const bal = tokenWithBalance?.balance;
  const balLoaded = bal !== undefined;

  return (
    <div className="relative rounded-[18px] border border-[#0d1e2e] bg-[#040e1e] px-4 pt-3 pb-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-['Inter',sans-serif] text-[13px] font-medium text-[#4d5a6e]">{label}</span>
        {balLoaded && onAmountChange && (
          <div className="flex items-center gap-2">
            <span className="font-['Inter',sans-serif] text-[11px] text-[#4d5a6e]">
              Balance: {(bal ?? 0).toLocaleString("en-US", { maximumFractionDigits: 6 })} {token.symbol}
            </span>
            {bal !== undefined && bal > 0 && (
              <button
                onClick={() => onAmountChange(String(bal))}
                className="rounded-[6px] border border-[#1a4a2a] bg-[#051510] px-1.5 py-0.5 font-['Inter',sans-serif] text-[10px] font-bold text-[#2dae50] hover:bg-[#071e12] transition-colors"
                data-testid="button-balance-max"
              >
                MAX
              </button>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <button
            onClick={() => setOpen(true)}
            className="flex shrink-0 items-center gap-2 rounded-2xl border border-[#0f2030] bg-[#060f1e] px-3 py-2 transition-colors hover:border-[#1a3a50] hover:bg-[#071525]"
            data-testid={`token-select-${label.replace(" ", "-").toLowerCase()}`}
          >
            <img
              src={token.icon}
              alt={token.symbol}
              className="h-7 w-7 rounded-full object-cover bg-[#0a1825]"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                img.onerror = null;
                img.src = `https://dd.dexscreener.com/ds-data/tokens/base/${token.address.toLowerCase()}.png`;
              }}
            />
            <span className="font-['Inter',sans-serif] text-base font-bold text-[#c8ccd2]">{token.symbol}</span>
            <ChevronDown className="h-4 w-4 text-[#3a4a5c]" />
          </button>
        </div>
        <div className="flex min-w-0 flex-1 flex-col items-end">
          {readonly ? (
            <span className={`w-full text-right font-['Inter',sans-serif] text-[26px] font-bold leading-none ${amount && amount !== "0" ? "text-[#3acd5b]" : "text-[#2a3a4c]"}`}>
              {amount || "0.00"}
            </span>
          ) : (
            <input
              type="number"
              value={amount}
              onChange={(e) => onAmountChange?.(e.target.value)}
              placeholder="0.0"
              min="0"
              className="w-full bg-transparent text-right font-['Inter',sans-serif] text-[26px] font-bold text-[#d0d4da] leading-none outline-none placeholder:text-[#2a3a4c] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              data-testid="input-sell-amount"
            />
          )}
          <span className="mt-1 font-['Inter',sans-serif] text-[13px] text-[#3a4a5c]">{usdValue}</span>
        </div>
      </div>

      {open && (
        <TokenPickerModal
          tokens={available}
          selected={token}
          onSelect={onTokenChange}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

// ─── DEX Source Selector ────────────────────────────────────────────────────────
function DexSourcePanel({
  selected,
  onToggle,
  onClose,
}: {
  selected: string[];
  onToggle: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="border-b border-[#071625] bg-[#020a14]">
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#060f1c]">
        <span className="font-['Inter',sans-serif] text-[13px] font-bold text-[#7a8494]">Liquidity Sources</span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { DEX_SOURCES.forEach((d) => { if (selected.includes(d.id)) onToggle(d.id); }); }}
            className="font-['Inter',sans-serif] text-[12px] text-[#2dae50] hover:underline"
            data-testid="btn-select-all-dex"
          >
            All Sources
          </button>
          <button onClick={onClose} className="text-[#3a4a5c] hover:text-[#7a8494]">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 p-4">
        {DEX_SOURCES.map((dex) => {
          const active = selected.length === 0 || selected.includes(dex.id);
          return (
            <button
              key={dex.id}
              onClick={() => onToggle(dex.id)}
              className={`flex items-center gap-2 rounded-[12px] border px-3 py-2.5 text-left transition-all ${
                active
                  ? "border-[#1a4a2a] bg-[#040f1a]"
                  : "border-[#0a1825] bg-[#020c18] opacity-50"
              }`}
              data-testid={`dex-toggle-${dex.id}`}
            >
              {active ? (
                <CheckSquare className="h-4 w-4 shrink-0 text-[#2dae50]" />
              ) : (
                <Square className="h-4 w-4 shrink-0 text-[#3a4a5c]" />
              )}
              <span className="font-['Inter',sans-serif] text-[12px] font-medium text-[#8c909a] truncate">{dex.name}</span>
            </button>
          );
        })}
      </div>
      {selected.length > 0 && (
        <p className="px-4 pb-3 font-['Inter',sans-serif] text-[11px] text-[#4d5a6e]">
          {selected.length} source{selected.length !== 1 ? "s" : ""} selected
        </p>
      )}
    </div>
  );
}

// ─── Routes Display ─────────────────────────────────────────────────────────────
function RoutesPanel({ quote, buyToken }: { quote: SwapQuote; buyToken: Token }) {
  if (!quote.sources || quote.sources.length === 0) return null;
  return (
    <div className="flex flex-col gap-2 p-4">
      <div className="flex w-full items-center gap-3 rounded-[14px] border border-[#1a4a2a] bg-[#040e1a] px-3 py-3.5">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="rounded-full bg-[#0a2418] px-2 py-0.5 font-['Inter',sans-serif] text-[10px] font-bold text-[#2dae50]">
              Best Route
            </span>
            <span className="font-['Inter',sans-serif] text-[14px] font-medium text-[#9da1a8]">
              {parseFloat(quote.buyAmountFormatted).toLocaleString("en-US", { maximumFractionDigits: 6 })} {buyToken.symbol}
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
            {quote.sources.map((s, i) => (
              <span key={i} className="flex items-center gap-1">
                <span className="font-['Inter',sans-serif] text-[11px] text-[#4d5a6e]">{s.name}</span>
                {s.proportion !== "0%" && (
                  <span className="font-['Inter',sans-serif] text-[11px] text-[#2a3840]">({s.proportion})</span>
                )}
                {i < quote.sources.length - 1 && (
                  <span className="text-[#1a2a38]">→</span>
                )}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-end shrink-0">
          {parseFloat(quote.totalNetworkFee) > 0 && (
            <span className="font-['Inter',sans-serif] text-[11px] text-[#7a8494]">
              ≈ {parseFloat(quote.totalNetworkFee).toFixed(5)} ETH gas
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Tx Status Modal ─────────────────────────────────────────────────────────────
function TxModal({ hash, cashback, onClose }: { hash: string; cashback: number; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-[360px] overflow-hidden rounded-[22px] border border-[#0f2a1a] bg-[#030e1a]">
        <div className="flex flex-col items-center gap-4 px-6 py-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#0a2418]">
            <Zap className="h-8 w-8 text-[#2dae50]" />
          </div>
          <div className="text-center">
            <p className="font-['Inter',sans-serif] text-[18px] font-bold text-[#c8ccd4]">Swap Submitted!</p>
            <p className="mt-1 font-['Inter',sans-serif] text-[13px] text-[#4d5a6e]">
              Your transaction has been broadcast to Base.
            </p>
          </div>

          {cashback > 0 && (
            <div className="w-full rounded-[14px] border border-[#1a4a2a] bg-[#040f18] px-4 py-3 text-center">
              <p className="font-['Inter',sans-serif] text-[11px] text-[#4d5a6e] uppercase tracking-wider mb-1">Cashback Earned</p>
              <p className="font-['Inter',sans-serif] text-[22px] font-bold text-[#2dae50]" data-testid="text-cashback-earned">
                +${cashback.toFixed(4)}
              </p>
              <p className="font-['Inter',sans-serif] text-[11px] text-[#3a5a40] mt-0.5">
                credited to your rewards· distributed weekly
              </p>
            </div>
          )}

          <a
            href={`https://basescan.org/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-[12px] border border-[#0f2030] bg-[#040e1e] px-4 py-2.5 font-['Inter',sans-serif] text-[13px] text-[#4a8fb5] hover:text-[#6ab0d5] transition-colors"
            data-testid="link-basescan"
          >
            View on BaseScan
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <button
            onClick={onClose}
            className="flex h-[48px] w-full items-center justify-center rounded-[14px] border border-[#37c056] bg-[#49f764] font-['Inter',sans-serif] text-[15px] font-bold text-[#061a0e] transition-all hover:bg-[#3de055]"
            data-testid="btn-close-tx-modal"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main SwapPage ───────────────────────────────────────────────────────────────
export function SwapPage() {
  const wallet = useWalletContext();

  // ── 30 Base tokens from DexScreener ─────────────────────────────────────────
  const { tokens: baseTokens, isLoading: tokensLoading } = useBaseTokens();

  // ── Wallet balances for all 30 tokens ───────────────────────────────────────
  const { balances } = useWalletBalances(wallet.address, baseTokens);

  // ── Merge token data with live wallet balances ───────────────────────────────
  const allTokens: Token[] = useMemo(() => {
    if (baseTokens.length === 0) return TOKENS; // fallback while loading
    return baseTokens.map((t) => {
      const bal = balances.find(
        (b) => b.address.toLowerCase() === t.address.toLowerCase()
      );
      return {
        ...t,
        balance: bal?.balance,
        balanceUsd: bal?.balanceUsd,
      };
    });
  }, [baseTokens, balances]);

  // Default to first two tokens (ETH and USDC)
  const defaultSell = useMemo(
    () => allTokens.find((t) => t.isNative) ?? allTokens[0] ?? TOKENS[0],
    [allTokens]
  );
  const defaultBuy = useMemo(
    () =>
      allTokens.find(
        (t) => t.address.toLowerCase() === "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913"
      ) ?? allTokens[1] ?? TOKENS[1],
    [allTokens]
  );

  const [sellToken, setSellToken] = useState<Token>(TOKENS[0]);
  const [buyToken, setBuyToken] = useState<Token>(TOKENS[1]);

  // Once base tokens load, update defaults
  useEffect(() => {
    if (allTokens.length > 1) {
      setSellToken((prev) => {
        const refreshed = allTokens.find(
          (t) => t.address.toLowerCase() === prev.address.toLowerCase()
        );
        return refreshed ?? defaultSell;
      });
      setBuyToken((prev) => {
        const refreshed = allTokens.find(
          (t) => t.address.toLowerCase() === prev.address.toLowerCase()
        );
        return refreshed ?? defaultBuy;
      });
    }
  }, [allTokens, defaultSell, defaultBuy]);

  const [sellAmount, setSellAmount] = useState("1");
  const [slippage, setSlippage] = useState("0.5");
  const [showSettings, setShowSettings] = useState(false);
  const [showDexPanel, setShowDexPanel] = useState(false);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [swapCashback, setSwapCashback] = useState(0);
  const [swapping, setSwapping] = useState(false);
  const [swapError, setSwapError] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);
  const [chartRange, setChartRange] = useState<ChartRange>("24H");

  const slippageBps = Math.round(parseFloat(slippage || "0.5") * 100);

  const { quote, isLoading, error: quoteError } = useSwapPrice(
    sellToken, buyToken, sellAmount, slippageBps, selectedSources
  );

  const { data: marketPrices } = useMarketPrices();

  // ── Real pair chart data from GeckoTerminal ──────────────────────────────────
  const { data: chartData, isLoading: chartLoading, change: chartChange } = usePairChart(sellToken.address, buyToken.address, chartRange);

  // Resolve a token's USD price from CoinGecko-backed market prices.
  // Stablecoins are pegged to $1; WETH tracks ETH.
  const tokenUsdPrice = useCallback(
    (token: Token | null): number => {
      if (!token) return 0;
      const sym = token.symbol.toUpperCase();
      if (sym === "USDC" || sym === "USDT" || sym === "DAI" || sym === "USDB") return 1;
      const lookup = sym === "WETH" ? "ETH" : sym;
      const match = (marketPrices ?? []).find(
        (p: MarketPrice) => p.symbol.toUpperCase() === lookup
      );
      return match?.price ?? 0;
    },
    [marketPrices]
  );

  const sellUsdPrice = tokenUsdPrice(sellToken);
  const buyUsdPrice = tokenUsdPrice(buyToken);

  const sharedUsdValue =
    quote && parseFloat(quote.buyAmountFormatted) > 0 && buyUsdPrice > 0
      ? `≈ $${(
          parseFloat(quote.buyAmountFormatted) * buyUsdPrice
        ).toLocaleString("en-US", {
          maximumFractionDigits: 2,
        })}`
      : "";

  const sellUsdValue = sharedUsdValue;
  const buyUsdValue = sharedUsdValue;

  const toggleSource = useCallback((id: string) => {
    setSelectedSources((prev) => {
      if (prev.length === 0) {
        return DEX_SOURCES.map((d) => d.id).filter((d) => d !== id);
      }
      if (prev.includes(id)) {
        const next = prev.filter((d) => d !== id);
        return next.length === 0 ? [] : next;
      }
      const next = [...prev, id];
      return next.length === DEX_SOURCES.length ? [] : next;
    });
  }, []);

  const handleFlip = () => {
    setSellToken(buyToken);
    setBuyToken(sellToken);
    setSellAmount(quote?.buyAmountFormatted ?? "1");
  };

  // Compute USD volume of a swap — uses sell-side price first, falls back to buy-side
  const computeVolumeUsd = useCallback((
    sellAmt: string,
    buyAmt: string,
  ): number => {
    const sell = parseFloat(sellAmt);
    const buy = parseFloat(buyAmt);
    if (sellUsdPrice > 0 && !isNaN(sell)) return sell * sellUsdPrice;
    if (buyUsdPrice > 0 && !isNaN(buy)) return buy * buyUsdPrice;
    return 0;
  }, [sellUsdPrice, buyUsdPrice]);

  // ─── Execute Swap ────────────────────────────────────────────────────────────
  const handleSwap = useCallback(async () => {
    if (!wallet.isConnected || !wallet.address) return;
    setSwapError(null);
    setSwapping(true);
    setSwapCashback(0);

    try {
      const fullQuote = await fetchSwapQuote(
        sellToken, buyToken, sellAmount, wallet.address, slippageBps, selectedSources
      );

      if (
        sellToken.address.toLowerCase() !== NATIVE_ETH_ADDR_LOWER &&
        fullQuote.issues?.allowance?.spender
      ) {
        const spender = fullQuote.issues.allowance.spender;
        const sellAmountWei = parseAmount(sellAmount, sellToken.decimals);
        const approveData = encodeApprove(spender, sellAmountWei);

        setApproving(true);
        try {
          await wallet.sendTransaction({
            to: sellToken.address,
            data: approveData,
            value: "0x0",
          });
          // Wait for approval to be mined
          await new Promise((r) => setTimeout(r, 3000));
        } finally {
          setApproving(false);
        }

        const refreshedQuote = await fetchSwapQuote(
          sellToken, buyToken, sellAmount, wallet.address, slippageBps, selectedSources
        );
        if (!refreshedQuote.transaction) throw new Error("No transaction data in quote after approval");

        const hash = await wallet.sendTransaction({
          to: refreshedQuote.transaction.to,
          data: refreshedQuote.transaction.data,
          value: toHexWei(refreshedQuote.transaction.value ?? "0"),
          gas: toHexWei(refreshedQuote.transaction.gas),
        });
        setTxHash(hash);
        const volUsd = computeVolumeUsd(sellAmount, refreshedQuote.buyAmountFormatted);
        const cb = volUsd * 0.0015;
        setSwapCashback(cb);
        recordSwapReward(wallet.address!, hash, sellToken.symbol, buyToken.symbol, volUsd).catch(() => {});
      } else {
        if (!fullQuote.transaction) throw new Error("No transaction data in quote");
        const hash = await wallet.sendTransaction({
          to: fullQuote.transaction.to,
          data: fullQuote.transaction.data,
          value: toHexWei(fullQuote.transaction.value ?? "0"),
          gas: toHexWei(fullQuote.transaction.gas),
        });
        setTxHash(hash);
        const volUsd = computeVolumeUsd(sellAmount, fullQuote.buyAmountFormatted);
        const cb = volUsd * 0.0015;
        setSwapCashback(cb);
        recordSwapReward(wallet.address!, hash, sellToken.symbol, buyToken.symbol, volUsd).catch(() => {});
      }
    } catch (err: any) {
      setSwapError(err.message ?? "Swap failed");
    } finally {
      setSwapping(false);
    }
  }, [wallet, sellToken, buyToken, sellAmount, slippageBps, selectedSources, computeVolumeUsd]);

  // ─── Computed display values ─────────────────────────────────────────────────
  const rateStr = quote
    ? `1 ${sellToken.symbol} = ${parseFloat(quote.price) > 0 ? parseFloat(quote.price).toLocaleString("en-US", { maximumFractionDigits: 6 }) : "…"} ${buyToken.symbol}`
    : null;

  const priceImpactNum = quote ? parseFloat(quote.estimatedPriceImpact) : 0;
  const priceImpactColor = priceImpactNum > 3 ? "text-[#c9543a]" : priceImpactNum > 1 ? "text-[#c9953a]" : "text-[#7a8494]";

  const swapBtnLabel = () => {
    if (approving) return "Approving...";
    if (swapping) return "Swapping...";
    if (!sellAmount || parseFloat(sellAmount) <= 0) return "Enter an amount";
    if (!quote && isLoading) return "Getting quote...";
    if (quoteError) return "No route found";
    return "Swap Now";
  };

  const swapBtnDisabled = approving || swapping || !quote || !!quoteError || !sellAmount || parseFloat(sellAmount) <= 0;

  return (
    <>
      <div className="w-full px-2 sm:px-3 py-3 sm:py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:gap-4">

          {/* ── LEFT COLUMN ─────────────────────────────────────────────── */}
          <div className="flex min-w-0 flex-1 flex-col gap-3">

            {/* Swap Widget */}
            <div className="relative w-full rounded-[22px] border border-[#0c1e30] bg-[#030d1a]">

              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[#071625]">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-[#2dae50]" />
                  <span className="font-['Inter',sans-serif] text-[15px] font-bold text-[#b0b5be]">Swap</span>
                  {tokensLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-[#2dae50]" />}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setShowDexPanel(!showDexPanel); setShowSettings(false); }}
                    className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 font-['Inter',sans-serif] text-[12px] font-medium transition-all ${
                      selectedSources.length > 0
                        ? "border-[#1a4a2a] bg-[#0a2015] text-[#2dae50]"
                        : "border-[#0d1e2e] bg-[#040e1e] text-[#4d5a6e] hover:border-[#1a3040]"
                    }`}
                    data-testid="btn-dex-sources"
                  >
                    {selectedSources.length > 0 ? `${selectedSources.length} sources` : "All DEXes"}
                    <ChevronDown className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => { setShowSettings(!showSettings); setShowDexPanel(false); }}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-[#0d1e2e] bg-[#040e1e] transition-colors hover:border-[#1a3040] hover:bg-[#060f1e]"
                    data-testid="btn-settings"
                  >
                    <Settings className="h-[14px] w-[14px] text-[#4a5a6a]" />
                  </button>
                </div>
              </div>

              {/* DEX Source Panel */}
              {showDexPanel && (
                <DexSourcePanel
                  selected={selectedSources}
                  onToggle={toggleSource}
                  onClose={() => setShowDexPanel(false)}
                />
              )}

              {/* Settings panel */}
              {showSettings && (
                <div className="border-b border-[#071625] bg-[#030c17] px-5 py-4">
                  <p className="mb-2 font-['Inter',sans-serif] text-[12px] font-medium text-[#4d5a6e]">Slippage Tolerance</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {SLIPPAGE_OPTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => setSlippage(s)}
                        className={`rounded-lg border px-3 py-1.5 font-['Inter',sans-serif] text-[13px] transition-all ${
                          slippage === s
                            ? "border-[#1a4a2a] bg-[#0a2015] text-[#2dae50]"
                            : "border-[#0d1e2e] bg-[#040e1e] text-[#4d5a6e] hover:border-[#122233]"
                        }`}
                        data-testid={`btn-slippage-${s}`}
                      >
                        {s}%
                      </button>
                    ))}
                    <div className="flex items-center gap-1 rounded-lg border border-[#0d1e2e] bg-[#040e1e] px-3 py-1.5">
                      <input
                        type="number"
                        value={slippage}
                        onChange={(e) => setSlippage(e.target.value)}
                        className="w-12 bg-transparent font-['Inter',sans-serif] text-[13px] text-[#9da1a8] outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                        data-testid="input-slippage-custom"
                      />
                      <span className="font-['Inter',sans-serif] text-[13px] text-[#3a4a5c]">%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Token inputs */}
              <div className="relative px-4 pt-3 pb-2">
                <TokenBox
                  label="You Pay"
                  token={sellToken}
                  amount={sellAmount}
                  onAmountChange={setSellAmount}
                  usdValue={sellUsdValue}
                  allTokens={allTokens}
                  onTokenChange={setSellToken}
                  disabledToken={buyToken}
                />

                {/* Flip */}
                <div className="relative z-10 flex justify-center py-1">
                  <button
                    onClick={handleFlip}
                    className="flex h-9 w-9 items-center justify-center rounded-full border-[3px] border-[#030d1a] bg-[#0b1e2e] shadow-lg transition-all hover:bg-[#0e2438] active:scale-90"
                    data-testid="btn-flip-tokens"
                  >
                    <ArrowUpDown className="h-4 w-4 text-[#2dae50]" />
                  </button>
                </div>

                <TokenBox
                  label="You Receive"
                  token={buyToken}
                  amount={isLoading ? "…" : (quote?.buyAmountFormatted ?? "")}
                  readonly
                  usdValue={buyUsdValue}
                  allTokens={allTokens}
                  onTokenChange={setBuyToken}
                  disabledToken={sellToken}
                />
              </div>

              {/* Swap Info */}
              <div className="px-4 pb-3">
                <div className="rounded-[14px] border border-[#080f1e] bg-[#020a14] px-4 py-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-['Inter',sans-serif] text-[13px] text-[#3a4a5c]">Rate</span>
                    <span className="font-['Inter',sans-serif] text-[13px] text-[#7a8494]">
                      {isLoading ? <Loader2 className="h-3 w-3 animate-spin text-[#2dae50] inline" /> : (rateStr ?? "—")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className="font-['Inter',sans-serif] text-[13px] text-[#3a4a5c]">Price Impact</span>
                      <Info className="h-3 w-3 text-[#2a3a4c]" />
                    </div>
                    <span className={`font-['Inter',sans-serif] text-[13px] ${priceImpactColor}`}>
                      {quote ? `-${priceImpactNum.toFixed(2)}%` : "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-['Inter',sans-serif] text-[13px] text-[#3a4a5c]">Network Fee</span>
                    <span className="font-['Inter',sans-serif] text-[13px] text-[#7a8494]">
                      {quote && parseFloat(quote.totalNetworkFee) > 0
                        ? `≈ ${parseFloat(quote.totalNetworkFee).toFixed(6)} ETH`
                        : "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-['Inter',sans-serif] text-[13px] text-[#3a4a5c]">Slippage</span>
                    <span className="font-['Inter',sans-serif] text-[13px] text-[#7a8494]">{slippage}%</span>
                  </div>
                
                  <div className="flex items-center justify-between">
                    <span className="font-['Inter',sans-serif] text-[13px] text-[#3a4a5c]">Est. Cashback</span>
                    <span className="font-['Inter',sans-serif] text-[13px] font-bold text-[#2dae50]" data-testid="text-est-cashback">
                      {quote && sellAmount
                        ? fmtUsd(computeVolumeUsd(sellAmount, quote.buyAmountFormatted) * 0.0015)
                        : "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-['Inter',sans-serif] text-[13px] text-[#3a4a5c]">SuperSwap Reward</span>
                    <span className="font-['Inter',sans-serif] text-[13px] font-bold text-[#2dae50]"> Earn $SUPER</span>
                  </div>
                </div>
              </div>

              {/* Error display */}
              {(quoteError || swapError) && (
                <div className="mx-4 mb-3 flex items-start gap-2 rounded-[12px] border border-[#3a1a1a] bg-[#1a0a0a] px-4 py-3">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-[#c9543a] mt-0.5" />
                  <span className="font-['Inter',sans-serif] text-[13px] text-[#c9543a]">
                    {swapError ?? quoteError}
                  </span>
                </div>
              )}

              {/* Swap / Connect button */}
              <div className="px-4 pb-4">
                {!wallet.isConnected ? (
                  <button
                    onClick={wallet.connect}
                    disabled={wallet.isConnecting}
                    className="flex h-[54px] w-full items-center justify-center gap-3 rounded-[14px] border border-[#12352d] bg-[#000d10] font-['Inter',sans-serif] text-[17px] font-bold text-[#2ca84c] transition-all hover:bg-[#041418] active:scale-[0.98] disabled:opacity-60"
                    data-testid="btn-connect-wallet"
                  >
                    {wallet.isConnecting ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                    {wallet.isConnecting ? "Connecting…" : "Connect Wallet to Swap"}
                  </button>
                ) : wallet.isWrongNetwork ? (
                  <button
                    onClick={wallet.switchToBase}
                    className="flex h-[54px] w-full items-center justify-center gap-3 rounded-[14px] border border-[#c9953a] bg-[#1a0e04] font-['Inter',sans-serif] text-[17px] font-bold text-[#c9953a] transition-all hover:bg-[#200f04] active:scale-[0.98]"
                    data-testid="btn-switch-network"
                  >
                    <AlertTriangle className="h-5 w-5" />
                    Switch to Base Network
                  </button>
                ) : (
                  <button
                    onClick={handleSwap}
                    disabled={swapBtnDisabled}
                    className="flex h-[54px] w-full items-center justify-center gap-3 rounded-[14px] border border-[#37c056] bg-[#49f764] font-['Inter',sans-serif] text-[17px] font-bold text-[#061a0e] transition-all hover:bg-[#3de055] active:scale-[0.98] disabled:cursor-not-allowed disabled:border-[#1a3a2a] disabled:bg-[#0a2015] disabled:text-[#2a5a3a]"
                    data-testid="btn-swap"
                  >
                    {(swapping || approving) && <Loader2 className="h-5 w-5 animate-spin" />}
                    <Zap className="h-5 w-5" />
                    {swapBtnLabel()}
                  </button>
                )}

                {wallet.isConnected && wallet.address && (
                  <p className="mt-2 text-center font-['Inter',sans-serif] text-[11px] text-[#2a3840]">
                    {wallet.address.slice(0, 6)}…{wallet.address.slice(-4)} · Base
                  </p>
                )}
                {wallet.error && (
                  <p className="mt-1 text-center font-['Inter',sans-serif] text-[12px] text-[#c9543a]">{wallet.error}</p>
                )}
              </div>
            </div>

            {/* Routes from 0x */}
            <div className="relative w-full overflow-hidden rounded-[22px] border border-[#0a1825] bg-[#020c18]">
              <div className="flex items-center justify-between border-b border-[#071522] px-5 py-4">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-[#2dae50]" />
                  <span className="font-['Inter',sans-serif] text-[15px] font-bold text-[#9da1a8]">Route</span>
                  {selectedSources.length > 0 && (
                    <span className="rounded-full bg-[#0a2015] px-2 py-0.5 font-['Inter',sans-serif] text-[10px] font-bold text-[#2dae50]">
                      {selectedSources.length} sources
                    </span>
                  )}
                </div>
                {isLoading && <Loader2 className="h-4 w-4 animate-spin text-[#2dae50]" />}
              </div>
              {quote ? (
                <RoutesPanel quote={quote} buyToken={buyToken} />
              ) : (
                <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                  <p className="font-['Inter',sans-serif] text-[13px] text-[#2a3840]">
                    {isLoading ? "Finding best route…" : quoteError ? "No route available" : "Enter an amount to see routes"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT COLUMN ─────────────────────────────────────────── */}
          <div className="flex w-full flex-col gap-3 lg:w-[316px] lg:shrink-0">

            {/* Price chart — real data from GeckoTerminal */}
            <div className="relative w-full overflow-hidden rounded-[22px] border border-[#0a1825] bg-[#020c18]">
              <div className="px-5 pt-4 pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <img
                        src={sellToken.icon}
                        alt={sellToken.symbol}
                        className="h-6 w-6 rounded-full object-cover bg-[#0a1825]"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          img.onerror = null;
                          img.src = `https://dd.dexscreener.com/ds-data/tokens/base/${sellToken.address.toLowerCase()}.png`;
                        }}
                      />
                      <span className="font-['Inter',sans-serif] text-[13px] font-bold text-[#8c909a]">
                        {sellToken.symbol} / {buyToken.symbol}
                      </span>
                      {chartChange !== null && (
                        <span className={`font-['Inter',sans-serif] text-[11px] font-semibold px-1.5 py-0.5 rounded-[6px] ${chartChange >= 0 ? "bg-[#0a2015] text-[#2dae50]" : "bg-[#1a0a0a] text-[#e05050]"}`}>
                          {chartChange >= 0 ? "+" : ""}{chartChange.toFixed(2)}%
                        </span>
                      )}
                    </div>
                    {quote ? (
                      <>
                        <p className="mt-1 font-['Inter',sans-serif] text-[24px] font-bold text-[#c8ccd4]">
                          {parseFloat(quote.price).toLocaleString("en-US", { maximumFractionDigits: 6 })}
                        </p>
                        <p className="font-['Inter',sans-serif] text-[12px] text-[#4d5a6e]">
                          {buyToken.symbol} per {sellToken.symbol}
                        </p>
                      </>
                    ) : (
                      <p className="mt-1 font-['Inter',sans-serif] text-[24px] font-bold text-[#2a3a4c]">—</p>
                    )}
                  </div>
                  {/* Range tabs */}
                  <div className="flex gap-1">
                    {(["1H", "24H", "7D"] as ChartRange[]).map((r) => (
                      <button
                        key={r}
                        onClick={() => setChartRange(r)}
                        className={`rounded-[7px] px-2 py-1 font-['Inter',sans-serif] text-[10px] font-bold transition-colors ${
                          chartRange === r
                            ? "bg-[#0c2018] text-[#2dae50] border border-[#1a4a2a]"
                            : "text-[#3a4a5c] hover:text-[#6a7a8c]"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="pb-2 h-[120px]">
                {chartLoading ? (
                  <div className="flex h-full items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-[#2dae50] opacity-50" />
                  </div>
                ) : chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={chartChange !== null && chartChange < 0 ? "#e05050" : "#2dae50"} stopOpacity={0.25} />
                          <stop offset="100%" stopColor={chartChange !== null && chartChange < 0 ? "#e05050" : "#2dae50"} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <YAxis domain={["auto", "auto"]} hide />
                      <Tooltip
                        contentStyle={{ background: "#040e1e", border: "1px solid #0d1e2e", borderRadius: "10px", padding: "6px 10px" }}
                        labelStyle={{ display: "none" }}
                        formatter={(val: number) => [
                          val >= 1
                            ? `$${val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : `$${val.toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 6 })}`,
                          sellToken.symbol
                        ]}
                        itemStyle={{ color: "#c8ccd4", fontSize: "12px", fontFamily: "Inter, sans-serif" }}
                      />
                      <Area
                        type="monotone"
                        dataKey="price"
                        stroke={chartChange !== null && chartChange < 0 ? "#e05050" : "#2dae50"}
                        strokeWidth={1.5}
                        fill="url(#chartGrad)"
                        dot={false}
                        activeDot={{ r: 3, fill: chartChange !== null && chartChange < 0 ? "#e05050" : "#2dae50", strokeWidth: 0 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <span className="font-['Inter',sans-serif] text-[12px] text-[#3a4a5c]">No chart data</span>
                  </div>
                )}
              </div>
            </div>

            {/* Popular Tokens quick-select */}
            <div className="relative w-full overflow-hidden rounded-[22px] border border-[#0a1825] bg-[#020c18]">
              <div className="border-b border-[#071522] px-5 py-4">
                <span className="font-['Inter',sans-serif] text-[15px] font-bold text-[#9da1a8]">Popular Tokens</span>
              </div>
              <div className="flex flex-col divide-y divide-[#071522]">
                {allTokens.slice(0, 6).map((token) => (
                  <button
                    key={token.address}
                    onClick={() => {
                      if (token.address !== buyToken.address) setSellToken(token);
                    }}
                    className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-[#030e1c] active:bg-[#040f1e]"
                    data-testid={`token-quick-${token.symbol}`}
                  >
                    <img
                      src={token.icon}
                      alt={token.symbol}
                      className="h-8 w-8 shrink-0 rounded-full object-cover bg-[#0a1825]"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        img.onerror = null;
                        img.src = `https://dd.dexscreener.com/ds-data/tokens/base/${token.address.toLowerCase()}.png`;
                      }}
                    />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="font-['Inter',sans-serif] text-[13px] font-bold text-[#9da1a8]">{token.symbol}</span>
                      <span className="font-['Inter',sans-serif] text-[12px] text-[#3a4a5c] truncate">{token.name}</span>
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                      {(() => {
                        const displayPrice = tokenUsdPrice(token) || token.price || 0;
                        return displayPrice > 0 ? (
                          <span className="font-['Inter',sans-serif] text-[13px] font-semibold text-[#c8ccd2]">
                            {displayPrice >= 1
                              ? `$${displayPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                              : `$${displayPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`}
                          </span>
                        ) : null;
                      })()}
                      {(token.address === sellToken.address || token.address === buyToken.address) && (
                        <span className="font-['Inter',sans-serif] text-[10px] text-[#2dae50]">
                          {token.address === sellToken.address ? "Selling" : "Buying"}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* DEX Sources Info */}
            <div className="relative w-full overflow-hidden rounded-[22px] border border-[#0a1825] bg-[#020c18] px-5 py-4">
              <p className="font-['Inter',sans-serif] text-[13px] font-bold text-[#7a8494] mb-3">Liquidity Sources</p>
              <div className="flex flex-wrap gap-2">
                {DEX_SOURCES.map((dex) => {
                  const active = selectedSources.length === 0 || selectedSources.includes(dex.id);
                  return (
                    <button
                      key={dex.id}
                      onClick={() => toggleSource(dex.id)}
                      className={`rounded-[8px] border px-2.5 py-1.5 font-['Inter',sans-serif] text-[11px] font-medium transition-all ${
                        active
                          ? "border-[#1a4a2a] bg-[#040f1a] text-[#2dae50]"
                          : "border-[#0a1825] bg-[#020c18] text-[#3a4a5c] opacity-60"
                      }`}
                    >
                      {dex.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Maximize Rewards Banner */}
            <div
              className="mt-1 relative w-full overflow-hidden rounded-[22px] border border-[#0c1825]"
              style={{ backgroundImage: `url(${maximizeRewardsBg})`, backgroundSize: "cover", backgroundPosition: "center" }}
            >
              <div className="flex flex-col sm:flex-row items-center gap-4 px-5 py-5 sm:px-7 sm:py-5">
                <img
                  src={tokenLogo}
                  alt="SuperSwap token logo"
                  className="h-14 w-14 shrink-0 rounded-full object-cover"
                />
                <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
                  <p className="font-['Inter',sans-serif] text-[15px] font-bold text-[#c8ccd4]">Maximize Your Rewards</p>
                  <p className="mt-0.5 font-['Inter',sans-serif] text-[12px] text-[#4d5a6e]">
                    Earn XP and cashback on every swap on Base.
                  </p>
                </div>
                <button className="shrink-0 flex items-center gap-1.5 rounded-[12px] border border-[#1a4a2a] bg-[#0a2015] px-3 py-2 font-['Inter',sans-serif] text-[12px] font-bold text-[#2dae50] transition-all hover:bg-[#0c2518]">
                  Learn More
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Tx success modal */}
      {txHash && <TxModal hash={txHash} cashback={swapCashback} onClose={() => { setTxHash(null); setSwapCashback(0); }} />}
    </>
  );
}
