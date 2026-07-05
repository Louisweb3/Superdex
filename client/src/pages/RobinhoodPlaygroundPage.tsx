import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { encodeAbiParameters, encodeFunctionData, parseEther, parseUnits } from "viem";
import { useWalletContext } from "@/context/WalletContext";
import { ConnectWalletModal } from "@/components/ConnectWalletModal";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeftRight, Layers, Sun, Moon } from "lucide-react";

import { Sidebar, MobileTabBar } from "@/components/robinhood/Sidebar";
import { WalletChip } from "@/components/robinhood/WalletChip";
import { RobinhoodLogo } from "@/components/robinhood/RobinhoodLogo";
import { DashboardView } from "@/components/robinhood/DashboardView";
import { DeployView } from "@/components/robinhood/DeployView";
import { ContractsView } from "@/components/robinhood/ContractsView";
import { RewardsView } from "@/components/robinhood/RewardsView";
import { ExplorerView } from "@/components/robinhood/ExplorerView";
import { SettingsView } from "@/components/robinhood/SettingsView";
import type { DeployedToken, RhTab } from "@/components/robinhood/types";

// ─── Robinhood Chain config ────────────────────────────────────────────────────
const RH_MAINNET = {
  chainId: "0x1237" as const, // 4663
  chainIdDecimal: 4663,
  chainName: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: ["https://rpc.mainnet.chain.robinhood.com"],
  blockExplorerUrls: ["https://robinhoodchain.blockscout.com"],
};
// Robinhood Chain Mainnet
const ACTIVE_NETWORK = RH_MAINNET;
const EXPLORER = "https://robinhoodchain.blockscout.com";
const RH_BRIDGE = "https://relay.link";
const RH_RPC = ACTIVE_NETWORK.rpcUrls[0];

// ─── XP claim contract ─────────────────────────────────────────────────────────
const XP_CLAIM_CONTRACT = "0x8cA81D184878f9A65a933066fD989D6eb4363cC2";
const XP_CLAIM_VALUE_ETH = "0.000038";
const XP_CLAIM_ABI = [
  {
    type: "function",
    name: "claim",
    stateMutability: "payable",
    inputs: [],
    outputs: [],
  },
] as const;

// ─── Minimal ERC-20 bytecode ──────────────────────────────────────────────────
// constructor(string _name, string _symbol, uint256 _supply)
// Compiled with solc 0.8.23, optimizer enabled (200 runs)
const ERC20_BYTECODE = "0x60806040526002805460ff1916601217905534801561001c575f5ffd5b506040516109c83803806109c883398101604081905261003b91610141565b5f610046848261023d565b506001610053838261023d565b506003819055335f818152600460209081526040808320859055518481527fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef910160405180910390a35050506102fb565b634e487b7160e01b5f52604160045260245ffd5b5f82601f8301126100c7575f5ffd5b81516001600160401b038111156100e0576100e06100a4565b604051601f8201601f19908116603f011681016001600160401b038111828210171561010e5761010e6100a4565b604052818152838201602001851015610125575f5ffd5b8160208501602083015e5f918101602001919091529392505050565b5f5f5f60608486031215610153575f5ffd5b83516001600160401b03811115610168575f5ffd5b610174868287016100b8565b602086015190945090506001600160401b03811115610191575f5ffd5b61019d868287016100b8565b925050604084015190509250925092565b600181811c908216806101c257607f821691505b6020821081036101e057634e487b7160e01b5f52602260045260245ffd5b50919050565b601f821115610238578282111561023857805f5260205f20601f840160051c602085101561021157505f5b90810190601f840160051c035f5b81811015610234575f8382015560010161021f565b5050505b505050565b81516001600160401b03811115610256576102566100a4565b61026a8161026484546101ae565b846101e6565b6020601f82116001811461029c575f83156102855750848201515b5f19600385901b1c1916600184901b1784556102f4565b5f84815260208120601f198516915b828110156102cb57878501518255602094850194600190920191016102ab565b50848210156102e857868401515f19600387901b60f8161c191681555b505060018360011b0184555b5050505050565b6106c0806103085f395ff3fe608060405234801561000f575f5ffd5b5060043610610090575f3560e01c8063313ce56711610063578063313ce567146100ff57806370a082311461011e57806395d89b411461013d578063a9059cbb14610145578063dd62ed3e14610158575f5ffd5b806306fdde0314610094578063095ea7b3146100b257806318160ddd146100d557806323b872dd146100ec575b5f5ffd5b61009c610182565b6040516100a99190610515565b60405180910390f35b6100c56100c0366004610565565b61020d565b60405190151581526020016100a9565b6100de60035481565b6040519081526020016100a9565b6100c56100fa36600461058d565b610279565b60025461010c9060ff1681565b60405160ff90911681526020016100a9565b6100de61012c3660046105c7565b60046020525f908152604090205481565b61009c610428565b6100c5610153366004610565565b610435565b6100de6101663660046105e7565b600560209081525f928352604080842090915290825290205481565b5f805461018e90610618565b80601f01602080910402602001604051908101604052809291908181526020018280546101ba90610618565b80156102055780601f106101dc57610100808354040283529160200191610205565b820191905f5260205f20905b8154815290600101906020018083116101e857829003601f168201915b505050505081565b335f8181526005602090815260408083206001600160a01b038716808552925280832085905551919290917f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925906102679086815260200190565b60405180910390a35060015b92915050565b6001600160a01b0383165f9081526005602090815260408083203384529091528120548211156102e35760405162461bcd60e51b815260206004820152601060248201526f45524332303a20616c6c6f77616e636560801b60448201526064015b60405180910390fd5b6001600160a01b0384165f908152600460205260409020548211156103405760405162461bcd60e51b8152602060048201526013602482015272115490cc8c0e881a5b9cdd59999a58da595b9d606a1b60448201526064016102da565b6001600160a01b0384165f90815260056020908152604080832033845290915281208054849290610372908490610664565b90915550506001600160a01b0384165f908152600460205260408120805484929061039e908490610664565b90915550506001600160a01b0383165f90815260046020526040812080548492906103ca908490610677565b92505081905550826001600160a01b0316846001600160a01b03167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef8460405161041691815260200190565b60405180910390a35060019392505050565b6001805461018e90610618565b335f908152600460205260408120548211156104895760405162461bcd60e51b8152602060048201526013602482015272115490cc8c0e881a5b9cdd59999a58da595b9d606a1b60448201526064016102da565b335f90815260046020526040812080548492906104a7908490610664565b90915550506001600160a01b0383165f90815260046020526040812080548492906104d3908490610677565b90915550506040518281526001600160a01b0384169033907fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef90602001610267565b602081525f82518060208401528060208501604085015e5f604082850101526040601f19601f83011684010191505092915050565b80356001600160a01b0381168114610560575f5ffd5b919050565b5f5f60408385031215610576575f5ffd5b61057f8361054a565b946020939093013593505050565b5f5f5f6060848603121561059f575f5ffd5b6105a88461054a565b92506105b66020850161054a565b929592945050506040919091013590565b5f602082840312156105d7575f5ffd5b6105e08261054a565b9392505050565b5f5f604083850312156105f8575f5ffd5b6106018361054a565b915061060f6020840161054a565b90509250929050565b600181811c9082168061062c57607f821691505b60208210810361064a57634e487b7160e01b5f52602260045260245ffd5b50919050565b634e487b7160e01b5f52601160045260245ffd5b8181038181111561027357610273610650565b808201808211156102735761027361065056fea26469706673582212207ed088fa9c64eac19c41e4d9019509ebe6054dee33b3836c872c07b6b31a254164736f6c63430008230033" as `0x${string}`;

// Minimal ERC-20 ABI for constructor encoding
const ERC20_CONSTRUCTOR_ABI = [
  { type: "string", name: "_name" },
  { type: "string", name: "_symbol" },
  { type: "uint256", name: "_totalSupply" },
] as const;

// ─── Solidity source (must match the compiled bytecode above exactly) ─────────
const ERC20_SOURCE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
contract Token {
    string public name;
    string public symbol;
    uint8 public decimals = 18;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    constructor(string memory _name, string memory _symbol, uint256 _supply) {
        name = _name;
        symbol = _symbol;
        totalSupply = _supply;
        balanceOf[msg.sender] = _supply;
        emit Transfer(address(0), msg.sender, _supply);
    }
    function transfer(address to, uint256 value) external returns (bool) {
        require(balanceOf[msg.sender] >= value, "ERC20: insufficient");
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        emit Transfer(msg.sender, to, value);
        return true;
    }
    function approve(address spender, uint256 value) external returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }
    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        require(allowance[from][msg.sender] >= value, "ERC20: allowance");
        require(balanceOf[from] >= value, "ERC20: insufficient");
        allowance[from][msg.sender] -= value;
        balanceOf[from] -= value;
        balanceOf[to] += value;
        emit Transfer(from, to, value);
        return true;
    }
}`;

async function fetchEthBalance(address: string, rpc: string): Promise<number> {
  try {
    const res = await fetch(rpc, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_getBalance",
        params: [address, "latest"],
      }),
    });
    const { result } = await res.json();
    return result ? parseInt(result, 16) / 1e18 : 0;
  } catch {
    return 0;
  }
}

const BLOCKSCOUT_API =
  "https://robinhoodchain.blockscout.com/api/v2/smart-contracts";

async function verifyOnBlockscout(
  contractAddress: string,
  constructorArgsHex: string,
): Promise<boolean> {
  try {
    const res = await fetch(
      `${BLOCKSCOUT_API}/${contractAddress}/verification/via/flattened-code`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          compiler_version: "v0.8.23+commit.f704f362",
          source_code: ERC20_SOURCE,
          is_optimization_enabled: true,
          optimization_runs: 200,
          contract_name: "Token",
          evm_version: "default",
          constructor_args: constructorArgsHex.replace(/^0x/, ""),
        }),
      },
    );
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Local storage helpers ────────────────────────────────────────────────────
const LS_CONTRACTS_KEY = "rh_playground_contracts";
const LS_GM_KEY = "rh_playground_gm";
const LS_GN_KEY = "rh_playground_gn";
const LS_XP_KEY = "rh_playground_xp";

function getStoredContracts(): DeployedToken[] {
  try {
    return JSON.parse(localStorage.getItem(LS_CONTRACTS_KEY) || "[]");
  } catch {
    return [];
  }
}
function saveContracts(list: DeployedToken[]) {
  localStorage.setItem(LS_CONTRACTS_KEY, JSON.stringify(list));
}
function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}
function hasClaimedGmToday() {
  return localStorage.getItem(LS_GM_KEY) === getTodayKey();
}
function markGmToday() {
  localStorage.setItem(LS_GM_KEY, getTodayKey());
}
function hasClaimedGnToday() {
  return localStorage.getItem(LS_GN_KEY) === getTodayKey();
}
function markGnToday() {
  localStorage.setItem(LS_GN_KEY, getTodayKey());
}
function hasClaimedXpToday() {
  return localStorage.getItem(LS_XP_KEY) === getTodayKey();
}
function markXpToday() {
  localStorage.setItem(LS_XP_KEY, getTodayKey());
}

// ─── XP streak tracking ───────────────────────────────────────────────────────
const LS_XP_STREAK_KEY = "rh_playground_xp_streak";
function getYesterdayKey() {
  return new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
}
function getXpStreak(): number {
  try {
    const raw = JSON.parse(localStorage.getItem(LS_XP_STREAK_KEY) || "null");
    if (!raw) return 0;
    const today = getTodayKey();
    const yesterday = getYesterdayKey();
    if (raw.lastDate === today || raw.lastDate === yesterday) return raw.count;
    return 0; // streak broken — more than a day was missed
  } catch {
    return 0;
  }
}
function bumpXpStreak(): number {
  const today = getTodayKey();
  const yesterday = getYesterdayKey();
  let raw: { count: number; lastDate: string } | null = null;
  try {
    raw = JSON.parse(localStorage.getItem(LS_XP_STREAK_KEY) || "null");
  } catch {
    raw = null;
  }
  let count = 1;
  if (raw?.lastDate === yesterday) count = raw.count + 1;
  else if (raw?.lastDate === today) count = raw.count;
  localStorage.setItem(LS_XP_STREAK_KEY, JSON.stringify({ count, lastDate: today }));
  return count;
}

// ─── RH RPC call helper ───────────────────────────────────────────────────────
async function waitForReceipt(
  txHash: string,
  rpc: string,
  maxMs = 60_000,
): Promise<any> {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    const r = await fetch(rpc, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_getTransactionReceipt",
        params: [txHash],
      }),
    });
    const { result } = await r.json();
    if (result) return result;
    await new Promise((res) => setTimeout(res, 2500));
  }
  throw new Error("Timed out waiting for receipt");
}

// ─────────────────────────────────────────────────────────────────────────────
export function RobinhoodPlaygroundPage(): JSX.Element {
  const wallet = useWalletContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [walletOpen, setWalletOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<RhTab>("dashboard");
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window === "undefined") return "dark";
    return (localStorage.getItem("rh_theme") as "dark" | "light") || "dark";
  });
  useEffect(() => {
    localStorage.setItem("rh_theme", theme);
  }, [theme]);

  // Platform-wide stats (global counter, not per-browser)
  const { data: platformStats } = useQuery<{ totalContractsDeployed: number }>({
    queryKey: ["/api/robinhood/stats"],
  });
  const totalContractsDeployed = platformStats?.totalContractsDeployed ?? 310;

  // Network state
  const [isOnRH, setIsOnRH] = useState(false);
  const [switchingNetwork, setSwitchingNetwork] = useState(false);

  // Create token state
  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [tokenSupply, setTokenSupply] = useState("1000000");
  const [deploying, setDeploying] = useState(false);
  const [deployedContracts, setDeployedContracts] =
    useState<DeployedToken[]>(getStoredContracts());

  // GM state
  const [sendingGm, setSendingGm] = useState(false);
  const [gmClaimed, setGmClaimed] = useState(hasClaimedGmToday());
  const [gmTxHash, setGmTxHash] = useState("");

  // GN state
  const [sendingGn, setSendingGn] = useState(false);
  const [gnClaimed, setGnClaimed] = useState(hasClaimedGnToday());
  const [gnTxHash, setGnTxHash] = useState("");

  // XP claim state
  const [claimingXp, setClaimingXp] = useState(false);
  const [xpClaimed, setXpClaimed] = useState(hasClaimedXpToday());
  const [xpTxHash, setXpTxHash] = useState("");
  const [xpStreak, setXpStreak] = useState(getXpStreak());

  // Check if on Robinhood Chain
  useEffect(() => {
    if (!wallet.isConnected) {
      setIsOnRH(false);
      return;
    }
    const checkChain = async () => {
      try {
        const chainId = await (window as any).ethereum.request({
          method: "eth_chainId",
        });
        setIsOnRH(
          chainId === RH_MAINNET.chainId ||
            parseInt(chainId, 16) === RH_MAINNET.chainIdDecimal,
        );
      } catch {
        setIsOnRH(false);
      }
    };
    checkChain();
    (window as any).ethereum?.on("chainChanged", checkChain);
    return () =>
      (window as any).ethereum?.removeListener("chainChanged", checkChain);
  }, [wallet.isConnected]);

  // ─── Switch to Robinhood Chain ──────────────────────────────────────────────
  const switchToRH = useCallback(async () => {
    setSwitchingNetwork(true);
    try {
      await (window as any).ethereum.request({
        method: "wallet_addEthereumChain",
        params: [ACTIVE_NETWORK],
      });
      setIsOnRH(true);
      toast({ title: "Connected to Robinhood Chain Mainnet" });
    } catch (e: any) {
      toast({
        title: "Failed to switch network",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setSwitchingNetwork(false);
    }
  }, [toast]);

  // ─── Deploy ERC-20 ──────────────────────────────────────────────────────────
  const deployToken = useCallback(async () => {
    if (!tokenName || !tokenSymbol || !tokenSupply) {
      toast({ title: "Fill all fields", variant: "destructive" });
      return;
    }
    if (!wallet.isConnected) {
      setWalletOpen(true);
      return;
    }
    if (!isOnRH) {
      await switchToRH();
      return;
    }
    setDeploying(true);
    try {
      const supply = parseUnits(tokenSupply, 18);
      const encodedArgs = encodeAbiParameters(ERC20_CONSTRUCTOR_ABI, [
        tokenName,
        tokenSymbol,
        supply,
      ]);
      const data = (ERC20_BYTECODE + encodedArgs.slice(2)) as `0x${string}`;
      const txHash = await (window as any).ethereum.request({
        method: "eth_sendTransaction",
        params: [{ from: wallet.address, data }],
      });
      toast({
        title: "Deployment tx submitted!",
        description: "Waiting for confirmation…",
      });
      const receipt = await waitForReceipt(txHash, RH_RPC);
      const contractAddress = receipt.contractAddress;
      const token: DeployedToken = {
        name: tokenName,
        symbol: tokenSymbol,
        supply: tokenSupply,
        address: contractAddress,
        txHash,
        deployedAt: Date.now(),
        network: ACTIVE_NETWORK.chainName,
        verifyStatus: "pending",
      };
      const updated = [token, ...deployedContracts];
      setDeployedContracts(updated);
      saveContracts(updated);
      setTokenName("");
      setTokenSymbol("");
      setTokenSupply("1000000");
      setActiveTab("contracts");
      toast({
        title: `✅ ${tokenName} deployed!`,
        description: contractAddress,
      });

      // Bump the platform-wide "Total Contracts Deployed" counter (non-blocking)
      apiRequest("POST", "/api/robinhood/stats/contract-deployed")
        .then(() => queryClient.invalidateQueries({ queryKey: ["/api/robinhood/stats"] }))
        .catch(() => {});

      // Auto-verify on Blockscout (non-blocking)
      verifyOnBlockscout(contractAddress, encodedArgs).then((ok) => {
        const status = ok ? "verified" : "failed";
        setDeployedContracts((prev) => {
          const next = prev.map((t) =>
            t.address === contractAddress ? { ...t, verifyStatus: status } : t,
          ) as DeployedToken[];
          saveContracts(next);
          return next;
        });
        if (ok) {
          toast({
            title: "✅ Contract verified on Blockscout!",
            description: contractAddress,
          });
        }
      });
    } catch (e: any) {
      toast({
        title: "Deployment failed",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setDeploying(false);
    }
  }, [
    tokenName,
    tokenSymbol,
    tokenSupply,
    wallet,
    isOnRH,
    switchToRH,
    deployedContracts,
    toast,
  ]);

  // ─── Send GM ────────────────────────────────────────────────────────────────
  const sendGm = useCallback(async () => {
    if (!wallet.isConnected) {
      setWalletOpen(true);
      return;
    }
    if (!isOnRH) {
      await switchToRH();
      return;
    }
    if (gmClaimed) {
      toast({ title: "Already sent GM today! Come back tomorrow." });
      return;
    }
    setSendingGm(true);
    try {
      // Encode "GM" as UTF-8 hex data sent on-chain
      const txHash = await (window as any).ethereum.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: wallet.address,
            to: wallet.address,
            value: "0x0",
            data: "0x474d", // UTF-8 "GM"
          },
        ],
      });
      setGmTxHash(txHash);
      markGmToday();
      setGmClaimed(true);
      toast({ title: "🌅 GM sent on Robinhood Chain!" });
    } catch (e: any) {
      toast({
        title: "GM failed",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setSendingGm(false);
    }
  }, [wallet, isOnRH, switchToRH, gmClaimed, toast]);

  // ─── Send GN ────────────────────────────────────────────────────────────────
  const sendGn = useCallback(async () => {
    if (!wallet.isConnected) {
      setWalletOpen(true);
      return;
    }
    if (!isOnRH) {
      await switchToRH();
      return;
    }
    if (gnClaimed) {
      toast({ title: "Already sent GN today! Come back tomorrow." });
      return;
    }
    setSendingGn(true);
    try {
      // Encode "GN" as UTF-8 hex data sent on-chain
      const txHash = await (window as any).ethereum.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: wallet.address,
            to: wallet.address,
            value: "0x0",
            data: "0x474e", // UTF-8 "GN"
          },
        ],
      });
      setGnTxHash(txHash);
      markGnToday();
      setGnClaimed(true);
      toast({ title: "🌙 GN sent on Robinhood Chain!" });
    } catch (e: any) {
      toast({
        title: "GN failed",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setSendingGn(false);
    }
  }, [wallet, isOnRH, switchToRH, gnClaimed, toast]);

  // ─── Claim XP ───────────────────────────────────────────────────────────────
  const claimXp = useCallback(async () => {
    if (!wallet.isConnected) {
      setWalletOpen(true);
      return;
    }
    if (!isOnRH) {
      await switchToRH();
      return;
    }
    if (xpClaimed) {
      toast({ title: "XP already claimed today! Come back tomorrow." });
      return;
    }
    setClaimingXp(true);
    try {
      const data = encodeFunctionData({ abi: XP_CLAIM_ABI, functionName: "claim" });
      const valueHex = `0x${parseEther(XP_CLAIM_VALUE_ETH).toString(16)}`;
      const txHash = await (window as any).ethereum.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: wallet.address,
            to: XP_CLAIM_CONTRACT,
            value: valueHex,
            data,
          },
        ],
      });
      setXpTxHash(txHash);
      markXpToday();
      setXpClaimed(true);
      setXpStreak(bumpXpStreak());
      toast({ title: "🎁 25 XP claimed on Robinhood Chain!" });
    } catch (e: any) {
      toast({
        title: "XP claim failed",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setClaimingXp(false);
    }
  }, [wallet, isOnRH, switchToRH, xpClaimed, toast]);

  // ─── Retry contract verification ───────────────────────────────────────────
  const retryVerify = useCallback(
    (address: string) => {
      const token = deployedContracts.find((t) => t.address === address);
      if (!token) return;
      const supply = parseUnits(token.supply, 18);
      const args = encodeAbiParameters(ERC20_CONSTRUCTOR_ABI, [
        token.name,
        token.symbol,
        supply,
      ]);
      setDeployedContracts((prev) => {
        const next = prev.map((t) =>
          t.address === address
            ? { ...t, verifyStatus: "pending" as const }
            : t,
        );
        saveContracts(next);
        return next;
      });
      verifyOnBlockscout(address, args).then((ok) => {
        setDeployedContracts((prev) => {
          const status: "verified" | "failed" = ok ? "verified" : "failed";
          const next = prev.map((t) =>
            t.address === address ? { ...t, verifyStatus: status } : t,
          );
          saveContracts(next);
          return next;
        });
        if (ok)
          toast({ title: "✅ Contract verified on Blockscout!" });
      });
    },
    [deployedContracts, toast],
  );

  const copyToClipboard = useCallback(
    (value: string) => {
      navigator.clipboard.writeText(value);
      toast({ title: "Copied!" });
    },
    [toast],
  );

  const isConnected = wallet.isConnected;

  return (
    <div
      className="rh-root min-h-screen bg-[var(--rh-bg)] text-[var(--rh-text)] flex"
      data-theme={theme}
      style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif" }}
    >
      <Sidebar activeTab={activeTab} onChange={setActiveTab} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="flex items-center justify-between gap-3 sm:gap-4 px-5 sm:px-8 h-[72px] border-b border-[var(--rh-border-06)] bg-[var(--rh-bg)]/80 backdrop-blur-xl sticky top-0 z-20">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            {/* SuperSwap home link */}
            <Link
              href="/"
              className="flex flex-shrink-0 items-center gap-1.5 sm:gap-2 focus:outline-none"
              aria-label="Back to SuperSwap home"
              data-testid="link-home"
            >
              <img
                className="h-6 w-5 sm:h-7 sm:w-[22px] object-cover"
                alt="SuperSwap logo"
                src="/figmaAssets/logo.png"
              />
              <span className="hidden sm:flex items-center leading-none font-['Inter',Helvetica] tracking-[0]">
                <span className="font-bold text-[#ccced2] text-[15px]">Super</span>
                <span className="font-normal text-[#37c359] text-[16px]">Swap</span>
              </span>
            </Link>

            <div className="w-px h-6 bg-[var(--rh-border-08)] flex-shrink-0 hidden sm:block" />

            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full border border-[var(--rh-border-08)] flex-shrink-0 overflow-hidden">
                <RobinhoodLogo size={36} />
              </div>
              <div className="min-w-0">
                <div className="text-[14px] font-semibold text-[var(--rh-text)] leading-tight truncate">
                  Robinhood Chain
                </div>
                <div className="text-[11px] text-[var(--rh-muted)] leading-tight truncate">
                  Playground
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="/swap"
              className="hidden sm:flex items-center gap-1.5 text-[13px] font-semibold text-[var(--rh-text)] bg-[var(--rh-surface-a03)] hover:bg-[var(--rh-surface-a06)] border border-[var(--rh-border-08)] px-3.5 h-[38px] rounded-[10px] transition-colors"
              data-testid="link-swap"
            >
              <ArrowLeftRight size={14} />
              Swap
            </a>
            <a
              href={RH_BRIDGE}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 text-[13px] font-semibold text-[var(--rh-text)] bg-[var(--rh-surface-a03)] hover:bg-[var(--rh-surface-a06)] border border-[var(--rh-border-08)] px-3.5 h-[38px] rounded-[10px] transition-colors"
              data-testid="link-bridge"
            >
              <Layers size={14} />
              Bridge
            </a>
            <button
              onClick={() =>
                setTheme((t) => (t === "dark" ? "light" : "dark"))
              }
              title={theme === "dark" ? "Switch to day mode" : "Switch to night mode"}
              className="flex items-center justify-center w-[38px] h-[38px] rounded-[10px] bg-[var(--rh-surface-a03)] hover:bg-[var(--rh-surface-a06)] border border-[var(--rh-border-08)] text-[var(--rh-text)] transition-colors"
              data-testid="button-toggle-theme"
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>

          <WalletChip
            isConnected={isConnected}
            isOnRH={isOnRH}
            address={wallet.address}
            balance={wallet.balance}
            switchingNetwork={switchingNetwork}
            onConnect={() => setWalletOpen(true)}
            onSwitchNetwork={switchToRH}
            onDisconnect={wallet.disconnect}
            onCopy={() => wallet.address && copyToClipboard(wallet.address)}
            explorerUrl={EXPLORER}
          />
        </header>

        {/* Main content */}
        <main className="flex-1 px-5 sm:px-8 py-7 pb-24 lg:pb-7 max-w-[1280px] w-full mx-auto">
          {activeTab === "dashboard" && (
            <DashboardView
              isConnected={isConnected}
              isOnRH={isOnRH}
              balance={wallet.balance}
              chainName={ACTIVE_NETWORK.chainName}
              tokens={deployedContracts}
              gmClaimed={gmClaimed}
              gnClaimed={gnClaimed}
              xpClaimed={xpClaimed}
              totalContractsDeployed={totalContractsDeployed}
              onNavigate={setActiveTab}
              switchToRH={switchToRH}
              switchingNetwork={switchingNetwork}
              explorerUrl={EXPLORER}
              sendingGm={sendingGm}
              gmTxHash={gmTxHash}
              sendGm={sendGm}
              sendingGn={sendingGn}
              gnTxHash={gnTxHash}
              sendGn={sendGn}
            />
          )}

          {activeTab === "deploy" && (
            <DeployView
              tokenName={tokenName}
              setTokenName={setTokenName}
              tokenSymbol={tokenSymbol}
              setTokenSymbol={setTokenSymbol}
              tokenSupply={tokenSupply}
              setTokenSupply={setTokenSupply}
              deploying={deploying}
              deployToken={deployToken}
              chainName={ACTIVE_NETWORK.chainName}
              isConnected={isConnected}
              isOnRH={isOnRH}
              switchToRH={switchToRH}
              switchingNetwork={switchingNetwork}
            />
          )}

          {activeTab === "contracts" && (
            <ContractsView
              tokens={deployedContracts}
              explorerUrl={EXPLORER}
              onCopy={copyToClipboard}
              onRetryVerify={retryVerify}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === "rewards" && (
            <RewardsView
              chainName={ACTIVE_NETWORK.chainName}
              explorerUrl={EXPLORER}
              xpClaimed={xpClaimed}
              claimingXp={claimingXp}
              xpTxHash={xpTxHash}
              claimXp={claimXp}
              xpStreak={xpStreak}
            />
          )}

          {activeTab === "explorer" && (
            <ExplorerView
              explorerUrl={EXPLORER}
              bridgeUrl={RH_BRIDGE}
              chainName={ACTIVE_NETWORK.chainName}
              chainId={ACTIVE_NETWORK.chainIdDecimal.toString()}
              rpcUrl={ACTIVE_NETWORK.rpcUrls[0]}
              isOnRH={isOnRH}
              switchToRH={switchToRH}
              switchingNetwork={switchingNetwork}
              onCopy={copyToClipboard}
            />
          )}

          {activeTab === "settings" && (
            <SettingsView
              chainName={ACTIVE_NETWORK.chainName}
              chainId={ACTIVE_NETWORK.chainIdDecimal.toString()}
              rpcUrl={ACTIVE_NETWORK.rpcUrls[0]}
            />
          )}
        </main>
      </div>

      <MobileTabBar activeTab={activeTab} onChange={setActiveTab} />

      <ConnectWalletModal
        open={walletOpen}
        onClose={() => setWalletOpen(false)}
        onConnect={async () => {
          setWalletOpen(false);
          await wallet.connect();
        }}
      />
    </div>
  );
}
