import { useMemo, useState } from "react";
import { Search, Copy, ExternalLink, RefreshCw, CheckCircle, Wallet, Droplets } from "lucide-react";
import type { DeployedToken, RhTab } from "./types";

interface ContractsViewProps {
  tokens: DeployedToken[];
  explorerUrl: string;
  onCopy: (address: string) => void;
  onRetryVerify: (address: string) => void;
  onNavigate: (tab: RhTab) => void;
  onAddToWallet: (token: DeployedToken) => void;
  uniswapLpUrl: (address: string) => string;
}

type SortKey = "name" | "supply" | "deployedAt";

export function ContractsView({ tokens, explorerUrl, onCopy, onRetryVerify, onNavigate, onAddToWallet, uniswapLpUrl }: ContractsViewProps) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("deployedAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const filtered = useMemo(() => {
    let list = tokens.filter((t) =>
      t.name.toLowerCase().includes(query.toLowerCase()) ||
      t.symbol.toLowerCase().includes(query.toLowerCase()) ||
      t.address.toLowerCase().includes(query.toLowerCase()),
    );
    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else if (sortKey === "supply") cmp = Number(a.supply) - Number(b.supply);
      else cmp = a.deployedAt - b.deployedAt;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [tokens, query, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  return (
    <div className="flex flex-col gap-4 pt-2">
      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-semibold text-white">My Contracts</h2>
        <button onClick={() => onNavigate("deployments")} className="text-[11px] text-[#0baa3b] hover:text-[#46D67B]">Deploy New</button>
      </div>

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#63666a]" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search contracts…"
          className="w-full bg-[#00090b] border border-[#081312] focus:border-[#0baa3b]/40 rounded-[8px] pl-9 pr-3 h-[38px] text-[13px] text-white outline-none transition-all placeholder:text-[#63666a]" />
      </div>

      {tokens.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center bg-[#00090b] border border-[#081312] rounded-[8px]">
          <div className="w-12 h-12 rounded-full bg-[#0baa3b]/10 flex items-center justify-center mb-3">
            <Search size={20} className="text-[#63666a]" />
          </div>
          <p className="text-[13px] text-[#63666a] font-medium">No contracts deployed yet</p>
          <button onClick={() => onNavigate("deployments")} className="mt-3 flex items-center gap-2 bg-[#020c0c] border border-[#024420] rounded-[6px] px-3 py-1.5 text-[11px] text-[#0a9637]">Deploy Contract</button>
        </div>
      ) : (
        <div className="bg-[#00090b] border border-[#081312] rounded-[8px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#081312]">
                  {[{ key: "name" as SortKey, label: "Token" }, { key: "supply" as SortKey, label: "Supply" }].map(({ key, label }) => (
                    <th key={key} onClick={() => toggleSort(key)} className="cursor-pointer select-none px-4 py-2.5 text-[10px] font-medium uppercase tracking-wider text-[#63666a]">{label}</th>
                  ))}
                  <th className="px-4 py-2.5 text-[10px] font-medium uppercase tracking-wider text-[#63666a]">Address</th>
                  <th className="px-4 py-2.5 text-[10px] font-medium uppercase tracking-wider text-[#63666a]">Status</th>
                  <th onClick={() => toggleSort("deployedAt")} className="cursor-pointer select-none px-4 py-2.5 text-[10px] font-medium uppercase tracking-wider text-[#63666a]">Created</th>
                  <th className="px-4 py-2.5 text-[10px] font-medium uppercase tracking-wider text-[#63666a] text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((token, i) => (
                  <tr key={i} className="border-b border-[#081312] last:border-0 hover:bg-[#081312]/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-[#0baa3b]/10 flex items-center justify-center text-[10px] font-semibold text-[#0baa3b] overflow-hidden">
                          {token.imageUrl ? (
                            <img src={token.imageUrl} alt={token.symbol} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                          ) : (
                            token.symbol.slice(0, 2)
                          )}
                        </div>
                        <div>
                          <div className="text-[12px] font-medium text-white">{token.name}</div>
                          <div className="text-[10px] text-[#63666a] font-mono">{token.symbol}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-[#c2c4c5] font-mono">{Number(token.supply).toLocaleString()}</td>
                    <td className="px-4 py-3 text-[12px] text-[#c2c4c5] font-mono">{token.address.slice(0, 6)}…{token.address.slice(-4)}</td>
                    <td className="px-4 py-3">
                      <div className={`flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[10px] font-medium ${
                        token.verifyStatus === "verified" ? "bg-[#01160e] text-[#0baa3b] border border-[#02100c]" :
                        token.verifyStatus === "pending" ? "bg-[#FFB547]/10 text-[#FFB547]" : "bg-[#FF5A67]/10 text-[#FF5A67]"
                      }`}>
                        {token.verifyStatus === "verified" && <CheckCircle size={10} />}
                        {token.verifyStatus ?? "pending"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[11px] text-[#63666a]">{new Date(token.deployedAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => onAddToWallet(token)} title="Add to wallet" data-testid={`button-add-wallet-${token.address}`} className="p-1 rounded-[6px] text-[#63666a] hover:text-white transition-colors"><Wallet size={12} /></button>
                        <a href={uniswapLpUrl(token.address)} target="_blank" rel="noopener noreferrer" title="Add LP on Uniswap" data-testid={`link-lp-${token.address}`} className="p-1 rounded-[6px] text-[#63666a] hover:text-white transition-colors"><Droplets size={12} /></a>
                        <button onClick={() => onCopy(token.address)} title="Copy address" className="p-1 rounded-[6px] text-[#63666a] hover:text-white transition-colors"><Copy size={12} /></button>
                        <a href={`${explorerUrl}/address/${token.address}`} target="_blank" rel="noopener noreferrer" title="View on explorer" className="p-1 rounded-[6px] text-[#63666a] hover:text-white transition-colors"><ExternalLink size={12} /></a>
                        {token.verifyStatus === "failed" && <button onClick={() => onRetryVerify(token.address)} title="Retry verify" className="p-1 rounded-[6px] text-[#FF5A67] hover:bg-[#FF5A67]/10 transition-colors"><RefreshCw size={12} /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
