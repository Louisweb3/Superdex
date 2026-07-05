import { useMemo, useState } from "react";
import {
  Search,
  Copy,
  ExternalLink,
  RefreshCw,
  Coins,
  ArrowUpDown,
  Rocket,
} from "lucide-react";
import { GlassCard } from "./GlassCard";
import { StatusChip } from "./StatusChip";
import type { DeployedToken, RhTab } from "./types";

interface ContractsViewProps {
  tokens: DeployedToken[];
  explorerUrl: string;
  onCopy: (address: string) => void;
  onRetryVerify: (address: string) => void;
  onNavigate: (tab: RhTab) => void;
}

type SortKey = "name" | "supply" | "deployedAt";

export function ContractsView({
  tokens,
  explorerUrl,
  onCopy,
  onRetryVerify,
  onNavigate,
}: ContractsViewProps) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("deployedAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const filtered = useMemo(() => {
    let list = tokens.filter(
      (t) =>
        t.name.toLowerCase().includes(query.toLowerCase()) ||
        t.symbol.toLowerCase().includes(query.toLowerCase()) ||
        t.address.toLowerCase().includes(query.toLowerCase()),
    );
    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else if (sortKey === "supply")
        cmp = Number(a.supply) - Number(b.supply);
      else cmp = a.deployedAt - b.deployedAt;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [tokens, query, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-[20px] font-semibold text-white">
          My Deployed Contracts
        </h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5E6B7A]"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search contracts…"
              data-testid="input-search-contracts"
              className="bg-white/[0.03] border border-white/[0.08] focus:border-[#5AE4A8]/40 rounded-[10px] pl-9 pr-3 h-[38px] text-[13px] text-white outline-none transition-all placeholder:text-[#5E6B7A] w-[220px]"
            />
          </div>
          <button
            onClick={() => onNavigate("deploy")}
            className="flex items-center gap-2 bg-gradient-to-br from-[#5AE4A8] to-[#46D67B] text-[#05070A] text-[13px] font-semibold px-4 h-[38px] rounded-[10px] transition-all hover:brightness-110"
          >
            Deploy New
          </button>
        </div>
      </div>

      {tokens.length === 0 ? (
        <GlassCard className="flex flex-col items-center justify-center py-16">
          <div className="w-14 h-14 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
            <Coins size={22} className="text-[#5E6B7A]" />
          </div>
          <p className="text-[#c9d1de] text-[14px] font-medium">
            No contracts deployed yet
          </p>
          <p className="text-[#5E6B7A] text-[12px] mt-1 mb-4">
            Create your first token from the Deploy page
          </p>
          <button
            onClick={() => onNavigate("deploy")}
            className="flex items-center gap-2 bg-gradient-to-br from-[#5AE4A8] to-[#46D67B] text-[#05070A] font-semibold text-[13px] px-4 py-2 rounded-[10px] transition-all hover:brightness-110"
          >
            <Rocket size={14} /> Deploy Contract
          </button>
        </GlassCard>
      ) : (
        <GlassCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {[
                    { key: "name" as SortKey, label: "Token" },
                    { key: "supply" as SortKey, label: "Supply" },
                  ].map(({ key, label }) => (
                    <th
                      key={key}
                      onClick={() => toggleSort(key)}
                      className="cursor-pointer select-none px-5 py-3 text-[11px] font-medium uppercase tracking-wider text-[#8B97A8]"
                    >
                      <span className="flex items-center gap-1">
                        {label} <ArrowUpDown size={11} />
                      </span>
                    </th>
                  ))}
                  <th className="px-5 py-3 text-[11px] font-medium uppercase tracking-wider text-[#8B97A8]">
                    Contract Address
                  </th>
                  <th className="px-5 py-3 text-[11px] font-medium uppercase tracking-wider text-[#8B97A8]">
                    Status
                  </th>
                  <th
                    onClick={() => toggleSort("deployedAt")}
                    className="cursor-pointer select-none px-5 py-3 text-[11px] font-medium uppercase tracking-wider text-[#8B97A8]"
                  >
                    <span className="flex items-center gap-1">
                      Created <ArrowUpDown size={11} />
                    </span>
                  </th>
                  <th className="px-5 py-3 text-[11px] font-medium uppercase tracking-wider text-[#8B97A8] text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((token, i) => (
                  <tr
                    key={i}
                    className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors"
                    data-testid={`row-contract-${i}`}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#5AE4A8]/10 border border-[#5AE4A8]/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-[#5AE4A8] text-[10px] font-semibold">
                            {token.symbol.slice(0, 3)}
                          </span>
                        </div>
                        <div>
                          <div className="text-[13px] font-medium text-white">
                            {token.name}
                          </div>
                          <div className="text-[11px] text-[#8B97A8] font-mono">
                            {token.symbol}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-[13px] text-[#c9d1de] font-mono">
                      {Number(token.supply).toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-[13px] text-[#c9d1de] font-mono">
                      {token.address.slice(0, 6)}…{token.address.slice(-4)}
                    </td>
                    <td className="px-5 py-4">
                      <StatusChip
                        kind={token.verifyStatus ?? "pending"}
                        spin={token.verifyStatus === "pending"}
                      />
                    </td>
                    <td className="px-5 py-4 text-[12px] text-[#8B97A8]">
                      {new Date(token.deployedAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onCopy(token.address)}
                          title="Copy address"
                          className="p-1.5 rounded-[8px] text-[#8B97A8] hover:text-white hover:bg-white/[0.06] transition-colors"
                        >
                          <Copy size={14} />
                        </button>
                        <a
                          href={`${explorerUrl}/address/${token.address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="View on explorer"
                          className="p-1.5 rounded-[8px] text-[#8B97A8] hover:text-white hover:bg-white/[0.06] transition-colors"
                        >
                          <ExternalLink size={14} />
                        </a>
                        {token.verifyStatus === "failed" && (
                          <button
                            onClick={() => onRetryVerify(token.address)}
                            title="Retry verification"
                            className="p-1.5 rounded-[8px] text-[#FF5A67] hover:bg-[#FF5A67]/10 transition-colors"
                          >
                            <RefreshCw size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
