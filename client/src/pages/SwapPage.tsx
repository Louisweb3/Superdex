import { useState, useCallback, useRef } from "react";
import {
  Settings, ChevronDown, ArrowUpDown, ChevronRight,
  Info, Zap, CheckSquare, Square, Loader2, ExternalLink, X, AlertTriangle
} from "lucide-react";
import { TOKENS, DEX_SOURCES, type Token, parseAmount, encodeApprove, NATIVE_ETH_ADDRESS, toHexWei } from "@/lib/tokens";
import { useWallet } from "@/hooks/useWallet";
import { useSwapPrice, fetchSwapQuote, type SwapQuote } from "@/hooks/useSwapQuote";

const SLIPPAGE_OPTIONS = ["0.1", "0.5", "1.0"];
const NATIVE_ETH_ADDR_LOWER = NATIVE_ETH_ADDRESS.toLowerCase();

// ─── Token Dropdown ────────────────────────────────────────────────────────────
function TokenDropdown({
  selected,
  tokens,
  onSelect,
  onClose,
}: {
  selected: Token;
  tokens: Token[];
  onSelect: (t: Token) => void;
  onClose: () => void;
}) {
  return (
    <div className="absolute left-0 top-full z-50 mt-2 w-[260px] overflow-hidden rounded-[18px] border border-[#0f2030] bg-[#030c18] shadow-2xl shadow-black/50">
      <div className="flex items-center justify-between border-b border-[#071522] px-4 py-3">
        <span className="font-['Inter',sans-serif] text-[13px] font-bold text-[#7a8494]">Select Token</span>
        <button onClick={onClose} className="text-[#3a4a5c] hover:text-[#7a8494]">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex flex-col py-1">
        {tokens.map((t) => (
          <button
            key={t.address}
            onClick={() => { onSelect(t); onClose(); }}
            className={`flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[#040e1c] ${
              t.address === selected.address ? "bg-[#040f1c]" : ""
            }`}
            data-testid={`token-option-${t.symbol}`}
          >
            <img src={t.icon} alt={t.symbol} className="h-8 w-8 shrink-0 rounded-full object-cover" />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="font-['Inter',sans-serif] text-[14px] font-bold text-[#c8ccd2]">{t.symbol}</span>
              <span className="font-['Inter',sans-serif] text-[12px] text-[#3a4a5c]">{t.name}</span>
            </div>
            {t.address === selected.address && (
              <div className="h-2 w-2 shrink-0 rounded-full bg-[#2dae50]" />
            )}
          </button>
        ))}
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
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div className="relative rounded-[18px] border border-[#0d1e2e] bg-[#040e1e] px-4 pt-3 pb-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-['Inter',sans-serif] text-[13px] font-medium text-[#4d5a6e]">{label}</span>
      </div>
      <div className="flex items-center gap-3" ref={ref}>
        <div className="relative shrink-0">
          <button
            onClick={() => setOpen(!open)}
            className="flex shrink-0 items-center gap-2 rounded-2xl border border-[#0f2030] bg-[#060f1e] px-3 py-2 transition-colors hover:border-[#1a3a50] hover:bg-[#071525]"
            data-testid={`token-select-${label.replace(" ", "-").toLowerCase()}`}
          >
            <img src={token.icon} alt={token.symbol} className="h-7 w-7 rounded-full object-cover" />
            <span className="font-['Inter',sans-serif] text-base font-bold text-[#c8ccd2]">{token.symbol}</span>
            <ChevronDown className="h-4 w-4 text-[#3a4a5c]" />
          </button>
          {open && (
            <TokenDropdown
              selected={token}
              tokens={allTokens.filter((t) => t.address !== disabledToken.address)}
              onSelect={onTokenChange}
              onClose={() => setOpen(false)}
            />
          )}
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
  const allSelected = selected.length === 0;
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
function TxModal({ hash, onClose }: { hash: string; onClose: () => void }) {
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
  const wallet = useWallet();

  const [sellToken, setSellToken] = useState<Token>(TOKENS[0]); // ETH
  const [buyToken, setBuyToken] = useState<Token>(TOKENS[1]);   // USDC
  const [sellAmount, setSellAmount] = useState("1");
  const [slippage, setSlippage] = useState("0.5");
  const [showSettings, setShowSettings] = useState(false);
  const [showDexPanel, setShowDexPanel] = useState(false);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [swapping, setSwapping] = useState(false);
  const [swapError, setSwapError] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);

  const slippageBps = Math.round(parseFloat(slippage || "0.5") * 100);

  const { quote, isLoading, error: quoteError } = useSwapPrice(
    sellToken, buyToken, sellAmount, slippageBps, selectedSources
  );

  const toggleSource = useCallback((id: string) => {
    setSelectedSources((prev) => {
      if (prev.length === 0) {
        // currently "all" → select all minus this one
        return DEX_SOURCES.map((d) => d.id).filter((d) => d !== id);
      }
      if (prev.includes(id)) {
        const next = prev.filter((d) => d !== id);
        return next.length === 0 ? [] : next; // empty = all
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

  // ─── Execute Swap ────────────────────────────────────────────────────────────
  const handleSwap = useCallback(async () => {
    if (!wallet.isConnected || !wallet.address) return;
    setSwapError(null);
    setSwapping(true);

    try {
      const fullQuote = await fetchSwapQuote(
        sellToken, buyToken, sellAmount, wallet.address, slippageBps, selectedSources
      );

      // Check if ERC20 approval is needed
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
          // Wait a bit for approval to propagate
          await new Promise((r) => setTimeout(r, 2000));
        } finally {
          setApproving(false);
        }

        // Re-fetch quote after approval
        const refreshedQuote = await fetchSwapQuote(
          sellToken, buyToken, sellAmount, wallet.address, slippageBps, selectedSources
        );
        if (!refreshedQuote.transaction) throw new Error("No transaction data in quote");

        const hash = await wallet.sendTransaction({
          to: refreshedQuote.transaction.to,
          data: refreshedQuote.transaction.data,
          value: toHexWei(refreshedQuote.transaction.value),
          gas: toHexWei(refreshedQuote.transaction.gas),
        });
        setTxHash(hash);
      } else {
        if (!fullQuote.transaction) throw new Error("No transaction data in quote");
        const hash = await wallet.sendTransaction({
          to: fullQuote.transaction.to,
          data: fullQuote.transaction.data,
          value: toHexWei(fullQuote.transaction.value),
          gas: toHexWei(fullQuote.transaction.gas),
        });
        setTxHash(hash);
      }
    } catch (err: any) {
      setSwapError(err.message ?? "Swap failed");
    } finally {
      setSwapping(false);
    }
  }, [wallet, sellToken, buyToken, sellAmount, slippageBps, selectedSources]);

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
            <div className="relative w-full overflow-hidden rounded-[22px] border border-[#0c1e30] bg-[#030d1a]">

              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[#071625]">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-[#2dae50]" />
                  <span className="font-['Inter',sans-serif] text-[15px] font-bold text-[#b0b5be]">Swap</span>
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
                  usdValue={quote && parseFloat(quote.price) > 0 ? `≈ $${(parseFloat(sellAmount || "0") * parseFloat(quote.price)).toLocaleString("en-US", { maximumFractionDigits: 2 })}` : ""}
                  allTokens={TOKENS}
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
                  usdValue={
                    quote && parseFloat(quote.buyAmountFormatted) > 0
                      ? `≈ $${(parseFloat(quote.buyAmountFormatted) * 1).toLocaleString("en-US", { maximumFractionDigits: 2 })}`
                      : ""
                  }
                  allTokens={TOKENS}
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
                    <span className="font-['Inter',sans-serif] text-[13px] text-[#3a4a5c]">Integrator Fee</span>
                    <span className="font-['Inter',sans-serif] text-[13px] text-[#4d5a6e]">0.3%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-['Inter',sans-serif] text-[13px] text-[#3a4a5c]">SuperSwap Reward</span>
                    <span className="font-['Inter',sans-serif] text-[13px] font-bold text-[#2dae50]">🎁 Earn $SUPER</span>
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

            {/* Price chart (sparkline static — 0x API doesn't offer OHLCV) */}
            <div className="relative w-full overflow-hidden rounded-[22px] border border-[#0a1825] bg-[#020c18]">
              <div className="px-5 pt-4 pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <img src={sellToken.icon} alt={sellToken.symbol} className="h-6 w-6 rounded-full object-cover" />
                      <span className="font-['Inter',sans-serif] text-[13px] font-bold text-[#8c909a]">
                        {sellToken.symbol} / {buyToken.symbol}
                      </span>
                    </div>
                    {quote ? (
                      <>
                        <p className="mt-1 font-['Inter',sans-serif] text-[24px] font-bold text-[#c8ccd4]">
                          {parseFloat(quote.price).toLocaleString("en-US", { maximumFractionDigits: 6 })}
                        </p>
                        <p className={`font-['Inter',sans-serif] text-[13px] ${priceImpactNum < 0 ? "text-[#2dae50]" : "text-[#7a8494]"}`}>
                          {buyToken.symbol} per {sellToken.symbol}
                        </p>
                      </>
                    ) : (
                      <p className="mt-1 font-['Inter',sans-serif] text-[24px] font-bold text-[#2a3a4c]">—</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="px-3 pb-2 h-[100px]">
                <svg viewBox="0 0 284 100" className="w-full h-full" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="swapChartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2dae50" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#2dae50" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <polygon
                    points="0,100 0,85 14,80 28,88 42,75 56,82 70,68 84,78 98,60 112,72 126,55 140,65 154,50 168,60 182,42 196,58 210,38 224,48 238,30 252,40 266,25 280,35 284,18 284,100"
                    fill="url(#swapChartGrad)"
                  />
                  <polyline
                    points="0,85 14,80 28,88 42,75 56,82 70,68 84,78 98,60 112,72 126,55 140,65 154,50 168,60 182,42 196,58 210,38 224,48 238,30 252,40 266,25 280,35 284,18"
                    fill="none" stroke="#2dae50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>

            {/* Popular Tokens quick-select */}
            <div className="relative w-full overflow-hidden rounded-[22px] border border-[#0a1825] bg-[#020c18]">
              <div className="border-b border-[#071522] px-5 py-4">
                <span className="font-['Inter',sans-serif] text-[15px] font-bold text-[#9da1a8]">Popular Tokens</span>
              </div>
              <div className="flex flex-col divide-y divide-[#071522]">
                {TOKENS.map((token) => (
                  <button
                    key={token.address}
                    onClick={() => {
                      if (token.address !== buyToken.address) setSellToken(token);
                    }}
                    className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-[#030e1c] active:bg-[#040f1e]"
                    data-testid={`token-quick-${token.symbol}`}
                  >
                    <img src={token.icon} alt={token.symbol} className="h-8 w-8 shrink-0 rounded-full object-cover" />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="font-['Inter',sans-serif] text-[13px] font-bold text-[#9da1a8]">{token.symbol}</span>
                      <span className="font-['Inter',sans-serif] text-[12px] text-[#3a4a5c]">{token.name}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="font-['Inter',sans-serif] text-[12px] text-[#4d5a6e]">
                        {token.address === sellToken.address ? "Selling" :
                         token.address === buyToken.address ? "Buying" : ""}
                      </span>
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
                      className={`rounded-full border px-2.5 py-1 font-['Inter',sans-serif] text-[11px] font-medium transition-all ${
                        active
                          ? "border-[#1a4a2a] bg-[#0a2015] text-[#2dae50]"
                          : "border-[#0a1825] bg-[#020c18] text-[#2a3840] opacity-50"
                      }`}
                      data-testid={`dex-pill-${dex.id}`}
                    >
                      {dex.name}
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 font-['Inter',sans-serif] text-[11px] text-[#2a3840]">
                Tap to toggle. All active = best route across all sources.
              </p>
            </div>
          </div>
        </div>

        {/* Maximize Rewards Banner */}
        <div className="mt-3 relative w-full overflow-hidden rounded-[22px] border border-[#0c1825] bg-[#020b16]">
          <div className="flex flex-col sm:flex-row items-center gap-4 px-5 py-5 sm:px-7 sm:py-5">
            <div className="flex h-[90px] w-[90px] shrink-0 items-center justify-center rounded-full bg-[#030e1e]">
              <Zap className="h-10 w-10 text-[#2dae50]" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col text-center sm:text-left">
              <span className="font-['Inter',sans-serif] text-[17px] font-bold text-[#b0b5be]">Maximize your rewards</span>
              <span className="mt-1 font-['Inter',sans-serif] text-[14px] text-[#4d5a6e]">
                Hold $SUPER to boost your swap rewards and unlock exclusive perks on every trade.
              </span>
            </div>
            <button
              className="flex shrink-0 items-center gap-2 rounded-[14px] border border-[#37c056] bg-[#49f764] px-6 py-3 font-['Inter',sans-serif] text-[15px] font-bold text-[#061a0e] transition-all hover:bg-[#3de055] active:scale-[0.98]"
              data-testid="btn-get-super"
            >
              Get $SUPER
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Transaction success modal */}
      {txHash && <TxModal hash={txHash} onClose={() => setTxHash(null)} />}
    </>
  );
}
