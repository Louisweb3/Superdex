import { useState, useEffect, useCallback } from "react";
import rhLogoSrc from "@assets/unnamed_(4)_1782977968316.png";
import robInuBannerSrc from "@assets/9D6965AA-F6C3-47D2-B4EF-3173224FB1AF_1782986675007.png";
import { encodeAbiParameters, parseUnits } from "viem";
import { useWalletContext } from "@/context/WalletContext";
import { ConnectWalletModal } from "@/components/ConnectWalletModal";
import {
  Coins,
  ExternalLink,
  Globe,
  CheckCircle,
  Copy,
  Loader2,
  Zap,
  Gift,
  RefreshCw,
  Send,
  Plus,
  ChevronRight,
  Info,
  Flame,
  ShieldCheck,
  ShieldX,
  Clock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

// ─── Minimal ERC-20 bytecode ──────────────────────────────────────────────────
// constructor(string _name, string _symbol, uint256 _supply)
// Compiled with solc 0.8.23, optimizer enabled (200 runs)
const ERC20_BYTECODE =
  "0x60806040526002805460ff1916601217905534801561001c575f5ffd5b506040516109c83803806109c883398101604081905261003b91610141565b5f610046848261023d565b506001610053838261023d565b506003819055335f818152600460209081526040808320859055518481527fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef910160405180910390a35050506102fb565b634e487b7160e01b5f52604160045260245ffd5b5f82601f8301126100c7575f5ffd5b81516001600160401b038111156100e0576100e06100a4565b604051601f8201601f19908116603f011681016001600160401b038111828210171561010e5761010e6100a4565b604052818152838201602001851015610125575f5ffd5b8160208501602083015e5f918101602001919091529392505050565b5f5f5f60608486031215610153575f5ffd5b83516001600160401b03811115610168575f5ffd5b610174868287016100b8565b602086015190945090506001600160401b03811115610191575f5ffd5b61019d868287016100b8565b925050604084015190509250925092565b600181811c908216806101c257607f821691505b6020821081036101e057634e487b7160e01b5f52602260045260245ffd5b50919050565b601f821115610238578282111561023857805f5260205f20601f840160051c602085101561021157505f5b90810190601f840160051c035f5b81811015610234575f8382015560010161021f565b5050505b505050565b81516001600160401b03811115610256576102566100a4565b61026a8161026484546101ae565b846101e6565b6020601f82116001811461029c575f83156102855750848201515b5f19600385901b1c1916600184901b1784556102f4565b5f84815260208120601f198516915b828110156102cb57878501518255602094850194600190920191016102ab565b50848210156102e857868401515f19600387901b60f8161c191681555b505060018360011b0184555b5050505050565b6106c0806103085f395ff3fe608060405234801561000f575f5ffd5b5060043610610090575f3560e01c8063313ce56711610063578063313ce567146100ff57806370a082311461011e57806395d89b411461013d578063a9059cbb14610145578063dd62ed3e14610158575f5ffd5b806306fdde0314610094578063095ea7b3146100b257806318160ddd146100d557806323b872dd146100ec575b5f5ffd5b61009c610182565b6040516100a99190610515565b60405180910390f35b6100c56100c0366004610565565b61020d565b60405190151581526020016100a9565b6100de60035481565b6040519081526020016100a9565b6100c56100fa36600461058d565b610279565b60025461010c9060ff1681565b60405160ff90911681526020016100a9565b6100de61012c3660046105c7565b60046020525f908152604090205481565b61009c610428565b6100c5610153366004610565565b610435565b6100de6101663660046105e7565b600560209081525f928352604080842090915290825290205481565b5f805461018e90610618565b80601f01602080910402602001604051908101604052809291908181526020018280546101ba90610618565b80156102055780601f106101dc57610100808354040283529160200191610205565b820191905f5260205f20905b8154815290600101906020018083116101e857829003601f168201915b505050505081565b335f8181526005602090815260408083206001600160a01b038716808552925280832085905551919290917f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925906102679086815260200190565b60405180910390a35060015b92915050565b6001600160a01b0383165f9081526005602090815260408083203384529091528120548211156102e35760405162461bcd60e51b815260206004820152601060248201526f45524332303a20616c6c6f77616e636560801b60448201526064015b60405180910390fd5b6001600160a01b0384165f908152600460205260409020548211156103405760405162461bcd60e51b8152602060048201526013602482015272115490cc8c0e881a5b9cdd59999a58da595b9d606a1b60448201526064016102da565b6001600160a01b0384165f90815260056020908152604080832033845290915281208054849290610372908490610664565b90915550506001600160a01b0384165f908152600460205260408120805484929061039e908490610664565b90915550506001600160a01b0383165f90815260046020526040812080548492906103ca908490610677565b92505081905550826001600160a01b0316846001600160a01b03167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef8460405161041691815260200190565b60405180910390a35060019392505050565b6001805461018e90610618565b335f908152600460205260408120548211156104895760405162461bcd60e51b8152602060048201526013602482015272115490cc8c0e881a5b9cdd59999a58da595b9d606a1b60448201526064016102da565b335f90815260046020526040812080548492906104a7908490610664565b90915550506001600160a01b0383165f90815260046020526040812080548492906104d3908490610677565b90915550506040518281526001600160a01b0384169033907fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef90602001610267565b602081525f82518060208401528060208501604085015e5f604082850101526040601f19601f83011684010191505092915050565b80356001600160a01b0381168114610560575f5ffd5b919050565b5f5f60408385031215610576575f5ffd5b61057f8361054a565b946020939093013593505050565b5f5f5f6060848603121561059f575f5ffd5b6105a88461054a565b92506105b66020850161054a565b929592945050506040919091013590565b5f602082840312156105d7575f5ffd5b6105e08261054a565b9392505050565b5f5f604083850312156105f8575f5ffd5b6106018361054a565b915061060f6020840161054a565b90509250929050565b600181811c9082168061062c57607f821691505b60208210810361064a57634e487b7160e01b5f52602260045260245ffd5b50919050565b634e487b7160e01b5f52601160045260245ffd5b8181038181111561027357610273610650565b808201808211156102735761027361065056fea26469706673582212207ed088fa9c64eac19c41e4d9019509ebe6054dee33b3836c872c07b6b31a254164736f6c63430008230033" as `0x${string}`;

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

const BASE_MAINNET = {
  chainId: "0x2105" as const,
  chainIdDecimal: 8453,
  chainName: "Base",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: ["https://mainnet.base.org"],
  blockExplorerUrls: ["https://basescan.org"],
};
const BASE_RPC = "https://mainnet.base.org";

const LP_ADDRESS = "0x42d919355c70Dd47c2282853A333ACB414a446de";
const LP_MAX_ETH = 2;
const ROBIINU_COMMUNITY_ALLOC = 200_000_000;

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
const LS_XP_KEY = "rh_playground_xp";

type DeployedToken = {
  name: string;
  symbol: string;
  supply: string;
  address: string;
  txHash: string;
  deployedAt: number;
  network: string;
  verifyStatus?: "pending" | "verified" | "failed";
};

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
function hasClaimedXpToday() {
  return localStorage.getItem(LS_XP_KEY) === getTodayKey();
}
function markXpToday() {
  localStorage.setItem(LS_XP_KEY, getTodayKey());
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

// ─── Robinhood logo ────────────────────────────────────────────────────────────
const RobinhoodLogo = ({ size = 32 }: { size?: number }) => (
  <img
    src={rhLogoSrc}
    width={size}
    height={size}
    alt="Robinhood"
    style={{ borderRadius: "50%", display: "block" }}
  />
);

// ─── Tab types ────────────────────────────────────────────────────────────────
type Tab = "create" | "tokens" | "gm" | "xp" | "explore";

// ─────────────────────────────────────────────────────────────────────────────
export function RobinhoodPlaygroundPage(): JSX.Element {
  const wallet = useWalletContext();
  const { toast } = useToast();
  const [walletOpen, setWalletOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("create");

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

  // XP claim state
  const [claimingXp, setClaimingXp] = useState(false);
  const [xpClaimed, setXpClaimed] = useState(hasClaimedXpToday());

  // RobInu LP contribution state
  const [baseLPBal, setBaseLPBal] = useState(0);
  const [rhLPBal, setRhLPBal] = useState(0);
  const [ethPrice, setEthPrice] = useState(2500);
  const [contribNetwork, setContribNetwork] = useState<"base" | "rh">("base");
  const [contribUsd, setContribUsd] = useState(10);
  const [contributing, setContributing] = useState(false);
  const [lpLoading, setLpLoading] = useState(true);

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

  // ─── Fetch LP balances + ETH price ──────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    async function load() {
      setLpLoading(true);
      const [base, rh] = await Promise.all([
        fetchEthBalance(LP_ADDRESS, BASE_RPC),
        fetchEthBalance(LP_ADDRESS, RH_RPC),
      ]);
      if (!mounted) return;
      setBaseLPBal(base);
      setRhLPBal(rh);
      try {
        const r = await fetch(
          "https://api.coinbase.com/v2/prices/ETH-USD/spot",
        );
        const d = await r.json();
        if (d.data?.amount && mounted) setEthPrice(parseFloat(d.data.amount));
      } catch {}
      setLpLoading(false);
    }
    load();
    const iv = setInterval(load, 30_000);
    return () => {
      mounted = false;
      clearInterval(iv);
    };
  }, []);

  // ─── Contribute to LP ────────────────────────────────────────────────────────
  const contributeToLP = useCallback(async () => {
    if (!wallet.isConnected) {
      setWalletOpen(true);
      return;
    }
    const ethAmount = contribUsd / ethPrice;
    const weiHex = "0x" + Math.floor(ethAmount * 1e18).toString(16);
    const targetNet = contribNetwork === "base" ? BASE_MAINNET : ACTIVE_NETWORK;
    setContributing(true);
    try {
      try {
        await (window as any).ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: targetNet.chainId }],
        });
      } catch (sw: any) {
        if (sw.code === 4902) {
          await (window as any).ethereum.request({
            method: "wallet_addEthereumChain",
            params: [targetNet],
          });
        } else throw sw;
      }
      const accs = await (window as any).ethereum.request({
        method: "eth_requestAccounts",
      });
      const txHash = await (window as any).ethereum.request({
        method: "eth_sendTransaction",
        params: [{ from: accs[0], to: LP_ADDRESS, value: weiHex }],
      });
      toast({
        title: "🎉 Contribution sent!",
        description: `TX: ${String(txHash).slice(0, 20)}…`,
      });
      setTimeout(async () => {
        const [b, r] = await Promise.all([
          fetchEthBalance(LP_ADDRESS, BASE_RPC),
          fetchEthBalance(LP_ADDRESS, RH_RPC),
        ]);
        setBaseLPBal(b);
        setRhLPBal(r);
      }, 8000);
    } catch (e: any) {
      toast({
        title: "Contribution failed",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setContributing(false);
    }
  }, [wallet, contribUsd, ethPrice, contribNetwork, toast]);

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
      setActiveTab("tokens");
      toast({
        title: `✅ ${tokenName} deployed!`,
        description: contractAddress,
      });

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

  // ─── Claim XP ───────────────────────────────────────────────────────────────
  const claimXp = useCallback(async () => {
    if (!wallet.isConnected) {
      setWalletOpen(true);
      return;
    }
    if (xpClaimed) {
      toast({ title: "XP already claimed today! Come back tomorrow." });
      return;
    }
    setClaimingXp(true);
    try {
      // Stub: contract address to be provided by user
      toast({
        title: "XP claim contract not yet configured.",
        description: "The contract address will be set when announced.",
        variant: "destructive",
      });
    } catch (e: any) {
      toast({
        title: "XP claim failed",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setClaimingXp(false);
    }
  }, [wallet, xpClaimed, toast]);

  const isConnected = wallet.isConnected;

  // ─── Shared network warning ──────────────────────────────────────────────────
  const NetworkWarning = () =>
    isConnected && !isOnRH ? (
      <div className="flex items-center gap-3 rounded-[10px] border border-yellow-500/20 bg-yellow-500/5 px-4 py-3 mb-4">
        <Info size={15} className="text-yellow-400 flex-shrink-0" />
        <span className="text-yellow-300/90 text-[13px]">
          You're not on Robinhood Chain.
        </span>
        <button
          onClick={switchToRH}
          disabled={switchingNetwork}
          className="ml-auto flex items-center gap-1.5 text-[12px] font-bold text-[#00C703] hover:text-green-300 transition-colors whitespace-nowrap"
        >
          {switchingNetwork ? (
            <Loader2 size={12} className="animate-spin" />
          ) : null}
          Switch Network
        </button>
      </div>
    ) : null;

  return (
    <div
      className="min-h-screen bg-[#090b09] text-white"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden border-b border-[#2a2c2a] bg-gradient-to-br from-[#0d0f0d] via-[#090b09] to-black px-5 sm:px-8 py-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(0,199,3,0.12),transparent_60%)] pointer-events-none" />
        <div className="relative max-w-[1200px] mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          {/* Left */}
          <div className="flex items-center gap-4">
            <RobinhoodLogo size={52} />
            <div>
              <span
                className="inline-flex items-center gap-1.5 bg-[#151715] border border-[#3a3c3a] text-[#e5e5e5] text-[11px] font-semibold px-3 py-1 rounded-full mb-2"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                <span aria-hidden>🐕</span> Native on Robinhood Chain Mainnet
              </span>
              <h1
                className="text-[30px] sm:text-[40px] font-extrabold tracking-tight leading-[1.05]"
                style={{ fontFamily: "'Syne', sans-serif" }}
              >
                <span className="text-white">ROBINHOOD</span>{" "}
                <span className="text-[#00C703]">CHAIN</span>
                <br />
                <span className="text-[#00C703] [text-shadow:0_0_18px_rgba(0,199,3,0.45)]">
                  PLAYGROUND
                </span>
              </h1>
              <p className="text-[#9a9a9a] text-[13px] mt-1.5">
                Deploy tokens · Send GM · Earn XP · Explore on-chain
              </p>
            </div>
          </div>

          {/* Right: Network status + CTA */}
          <div className="flex flex-col items-start sm:items-end gap-2">
            {isConnected ? (
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${isOnRH ? "bg-[#00C703] shadow-[0_0_6px_#00C703]" : "bg-yellow-400"} animate-pulse`}
                />
                <span className="text-[13px] text-[#b0b0b0]">
                  {isOnRH ? "Connected to Robinhood Chain" : "Wrong network"}
                </span>
              </div>
            ) : (
              <span className="text-[13px] text-[#9a9a9a]">
                Wallet not connected
              </span>
            )}

            {!isConnected ? (
              <button
                onClick={() => setWalletOpen(true)}
                className="flex items-center gap-2 bg-[#00C703] hover:bg-[#00e003] text-black font-bold text-[14px] px-5 py-2.5 rounded-full shadow-[0_0_20px_rgba(0,199,3,0.4)] transition-all"
              >
                Connect Wallet
              </button>
            ) : !isOnRH ? (
              <button
                onClick={switchToRH}
                disabled={switchingNetwork}
                className="flex items-center gap-2 bg-[#00C703] hover:bg-[#00e003] text-black font-bold text-[14px] px-5 py-2.5 rounded-full shadow-[0_0_20px_rgba(0,199,3,0.4)] transition-all disabled:opacity-60"
              >
                {switchingNetwork && (
                  <Loader2 size={14} className="animate-spin" />
                )}
                Add Robinhood Chain
              </button>
            ) : (
              <div className="flex items-center gap-2 text-[13px] text-[#00C703] font-semibold">
                <CheckCircle size={16} />
                Ready to build
              </div>
            )}
          </div>
        </div>

        {/* Network stats bar */}
        <div className="relative max-w-[1200px] mx-auto mt-6 flex flex-wrap gap-3">
          {[
            {
              label: "Chain ID",
              value: ACTIVE_NETWORK.chainIdDecimal.toString(),
            },
            { label: "Block Time", value: "100ms" },
            { label: "Gas Token", value: "ETH" },
            { label: "Stack", value: "Arbitrum Orbit L2" },
            { label: "DA Layer", value: "Ethereum blobs" },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="flex items-center gap-2 bg-[#1c1e1c] border border-[#3a3c3a] rounded-[10px] px-3 py-1.5"
            >
              <span className="text-[#9a9a9a] text-[11px]">{label}</span>
              <span className="text-[#e5e5e5] text-[12px] font-semibold">
                {value}
              </span>
            </div>
          ))}
          <a
            href={RH_BRIDGE}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-[#1c1e1c] border border-[#3a3c3a] hover:border-[#00C703]/40 rounded-[10px] px-3 py-1.5 transition-colors group"
          >
            <Zap size={12} className="text-[#00C703]" />
            <span className="text-[#e5e5e5] text-[12px] font-semibold group-hover:text-[#00C703] transition-colors">
              Bridge
            </span>
            <ExternalLink size={10} className="text-[#9a9a9a]" />
          </a>
        </div>
      </div>

      {/* ── RobInu LP Contribution ─────────────────────────────────────────────── */}
      {(() => {
        const totalRaised = baseLPBal + rhLPBal;
        const pct = Math.min((totalRaised / LP_MAX_ETH) * 100, 100);
        const ethAmount = contribUsd / ethPrice;
        const tokensForContrib =
          (ethAmount / LP_MAX_ETH) * ROBIINU_COMMUNITY_ALLOC;
        const fmt = (n: number) =>
          n.toLocaleString(undefined, { maximumFractionDigits: 4 });
        const fmtM = (n: number) =>
          n >= 1_000_000
            ? (n / 1_000_000).toFixed(2) + "M"
            : n.toLocaleString(undefined, { maximumFractionDigits: 0 });

        return (
          <div className="max-w-[1200px] mx-auto px-5 sm:px-8 pt-8 pb-2">
            {/* Banner */}
            <img
              src={robInuBannerSrc}
              alt="Robin Inu — The rFirst Community Backed Memecoin on Robinhood"
              className="w-full h-auto rounded-[18px] block mb-5"
              data-testid="robinu-banner"
            />

            {/* Contribution card */}
            <div className="bg-[#151715] border border-[#3a3c3a] rounded-[20px] p-6">
              {/* Header row */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                <div>
                  <span className="inline-block text-[11px] font-bold uppercase tracking-[0.18em] text-[#00C703] mb-1.5">
                    Join the Pack
                  </span>
                  <h2
                    className="text-[24px] font-extrabold text-white leading-tight"
                    style={{ fontFamily: "'Syne', sans-serif" }}
                  >
                    $RobInu LP Contribution
                  </h2>
                  <p className="text-[13px] text-[#9a9a9a] mt-1">
                    Contribute ETH to seed the $RobInu liquidity pool on
                    Robinhood Chain.
                    <br />
                    <span className="text-[#e5e5e5]">
                      20% of the 1B total supply (200M $RobInu)
                    </span>{" "}
                    is allocated to community contributors.
                  </p>
                </div>
                <div className="shrink-0 text-right bg-[#00C703]/5 border border-[#00C703]/20 rounded-[12px] px-4 py-2.5">
                  <div className="text-[11px] text-[#9a9a9a] uppercase tracking-wider mb-0.5">
                    Community Allocation
                  </div>
                  <div className="text-[26px] font-black text-[#00C703] leading-tight">
                    200M
                  </div>
                  <div className="text-[12px] text-[#9a9a9a]">
                    $RobInu tokens
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] font-bold text-white">
                    {lpLoading ? "Loading…" : `${fmt(totalRaised)} ETH raised`}
                  </span>
                  <span className="text-[13px] text-[#9a9a9a]">
                    Goal: {LP_MAX_ETH} ETH
                  </span>
                </div>
                <div className="relative h-4 w-full rounded-full bg-[#3a3c3a] overflow-hidden border border-[#3a3c3a]">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                    style={{
                      width: `${pct}%`,
                      background:
                        "linear-gradient(90deg, #00C703 0%, #5dff61 100%)",
                      boxShadow:
                        pct > 0 ? "0 0 12px rgba(0,199,3,0.5)" : "none",
                    }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2 text-[11px] text-[#9a9a9a]">
                  <span>Base: {lpLoading ? "…" : `${fmt(baseLPBal)} ETH`}</span>
                  <span className="font-bold text-[#00C703]">
                    {pct.toFixed(1)}% filled
                  </span>
                  <span>
                    RH Chain: {lpLoading ? "…" : `${fmt(rhLPBal)} ETH`}
                  </span>
                </div>
              </div>

              {/* Network + Amount + CTA */}
              <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-end">
                {/* Network selector */}
                <div className="flex-1">
                  <label className="block text-[11px] text-[#9a9a9a] uppercase tracking-wider mb-2">
                    Network
                  </label>
                  <div className="flex gap-2">
                    {(["base", "rh"] as const).map((net) => (
                      <button
                        key={net}
                        onClick={() => setContribNetwork(net)}
                        data-testid={`contrib-network-${net}`}
                        className={`flex-1 py-2.5 rounded-full text-[13px] font-bold border transition-all ${
                          contribNetwork === net
                            ? "bg-[#00C703]/15 border-[#00C703] text-[#00C703]"
                            : "bg-[#1c1e1c] border-[#3a3c3a] text-[#9a9a9a] hover:border-[#00C703]/40 hover:text-[#e5e5e5]"
                        }`}
                      >
                        {net === "base" ? "Base" : "RH Chain"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount selector */}
                <div className="flex-1">
                  <label className="block text-[11px] text-[#9a9a9a] uppercase tracking-wider mb-2">
                    Amount (USD · min $10, max $50)
                  </label>
                  <div className="flex gap-2">
                    {[10, 25, 50].map((amt) => (
                      <button
                        key={amt}
                        onClick={() => setContribUsd(amt)}
                        data-testid={`contrib-amount-${amt}`}
                        className={`flex-1 py-2.5 rounded-full text-[13px] font-bold border transition-all ${
                          contribUsd === amt
                            ? "bg-[#00C703]/15 border-[#00C703] text-[#00C703]"
                            : "bg-[#1c1e1c] border-[#3a3c3a] text-[#9a9a9a] hover:border-[#00C703]/40 hover:text-[#e5e5e5]"
                        }`}
                      >
                        ${amt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Contribute CTA */}
                <div className="flex-shrink-0">
                  <div className="text-[11px] text-[#9a9a9a] uppercase tracking-wider mb-2 sm:text-right">
                    You receive (est.)
                  </div>
                  <button
                    onClick={contributeToLP}
                    disabled={contributing || pct >= 100}
                    data-testid="btn-contribute-lp"
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#00C703] hover:bg-[#00e003] disabled:opacity-50 text-black font-black text-[14px] px-6 py-2.5 rounded-full shadow-[0_0_20px_rgba(0,199,3,0.35)] transition-all whitespace-nowrap"
                  >
                    {contributing && (
                      <Loader2 size={14} className="animate-spin" />
                    )}
                    {pct >= 100
                      ? "Goal Reached!"
                      : `Contribute $${contribUsd} · ${fmtM(tokensForContrib)} $RobInu`}
                  </button>
                  <div className="text-[11px] text-[#9a9a9a] mt-1 sm:text-right">
                    ≈ {fmt(ethAmount)} ETH @ $
                    {Math.round(ethPrice).toLocaleString()}/ETH
                  </div>
                </div>
              </div>

              {/* Disclaimer */}
              <p className="mt-4 text-[11px] text-[#3a4a3a] border-t border-[#3a3c3a] pt-3">
                Contributions are sent directly to the LP seeding address. Token
                distribution is based on your share of the total 2 ETH raised.
                Final allocation is proportional.
              </p>
            </div>
          </div>
        );
      })()}

      {/* ── Tab bar ────────────────────────────────────────────────────────────── */}
      <div className="border-b border-[#2a2c2a] bg-[#090b09] px-5 sm:px-8 py-3">
        <div className="max-w-[1200px] mx-auto flex items-center gap-2 overflow-x-auto scrollbar-none">
          {(
            [
              { id: "create", label: "Create Token", icon: Plus },
              {
                id: "tokens",
                label: `My Tokens (${deployedContracts.length})`,
                icon: Coins,
              },
              { id: "gm", label: "Send GM", icon: Send },
              { id: "xp", label: "Claim 25 XP", icon: Gift },
              { id: "explore", label: "Explorer", icon: Globe },
            ] as { id: Tab; label: string; icon: any }[]
          ).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              data-testid={`tab-rh-${id}`}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap border transition-all ${
                activeTab === id
                  ? "bg-[#00C703]/10 border-[#00C703] text-[#00C703]"
                  : "bg-transparent border-[#3a3c3a] text-[#9a9a9a] hover:text-[#e5e5e5] hover:border-[#00C703]/40"
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ────────────────────────────────────────────────────────── */}
      <div className="max-w-[1200px] mx-auto px-5 sm:px-8 py-8">
        {/* CREATE TOKEN */}
        {activeTab === "create" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form card */}
            <div className="bg-[#151715] border border-[#3a3c3a] rounded-[16px] p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-[#00C703]/10 border border-[#00C703]/20 flex items-center justify-center">
                  <Coins size={18} className="text-[#00C703]" />
                </div>
                <div>
                  <h2
                    className="text-[16px] font-bold text-white"
                    style={{ fontFamily: "'Syne', sans-serif" }}
                  >
                    Create ERC-20 Token
                  </h2>
                  <p className="text-[12px] text-[#9a9a9a]">
                    Deploy to Robinhood Chain Mainnet
                  </p>
                </div>
              </div>

              <NetworkWarning />

              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-[12px] font-semibold text-[#b0b0b0] uppercase tracking-wider mb-1.5 block">
                    Token Name
                  </label>
                  <input
                    type="text"
                    value={tokenName}
                    onChange={(e) => setTokenName(e.target.value)}
                    placeholder="e.g. My Awesome Token"
                    data-testid="input-token-name"
                    className="w-full bg-[#1c1e1c] border border-[#3a3c3a] focus:border-[#00C703]/60 rounded-[10px] px-4 py-3 text-white text-[14px] outline-none transition-colors placeholder:text-[#707070]"
                  />
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-[#b0b0b0] uppercase tracking-wider mb-1.5 block">
                    Token Symbol
                  </label>
                  <input
                    type="text"
                    value={tokenSymbol}
                    onChange={(e) =>
                      setTokenSymbol(e.target.value.toUpperCase().slice(0, 8))
                    }
                    placeholder="e.g. MAT"
                    data-testid="input-token-symbol"
                    className="w-full bg-[#1c1e1c] border border-[#3a3c3a] focus:border-[#00C703]/60 rounded-[10px] px-4 py-3 text-white text-[14px] outline-none transition-colors placeholder:text-[#707070]"
                  />
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-[#b0b0b0] uppercase tracking-wider mb-1.5 block">
                    Initial Supply
                  </label>
                  <input
                    type="number"
                    value={tokenSupply}
                    onChange={(e) => setTokenSupply(e.target.value)}
                    placeholder="1000000"
                    data-testid="input-token-supply"
                    className="w-full bg-[#1c1e1c] border border-[#3a3c3a] focus:border-[#00C703]/60 rounded-[10px] px-4 py-3 text-white text-[14px] outline-none transition-colors placeholder:text-[#707070]"
                  />
                  <p className="text-[11px] text-[#707070] mt-1">
                    Decimals: 18 (standard ERC-20)
                  </p>
                </div>

                <button
                  onClick={deployToken}
                  disabled={
                    deploying || !tokenName || !tokenSymbol || !tokenSupply
                  }
                  data-testid="button-deploy-token"
                  className="w-full flex items-center justify-center gap-2 bg-[#00C703] hover:bg-[#00e003] disabled:opacity-50 active:scale-[0.98] text-black font-bold text-[15px] py-3.5 rounded-full shadow-[0_0_20px_rgba(0,199,3,0.35)] transition-all"
                >
                  {deploying ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Zap size={18} />
                  )}
                  {deploying ? "Deploying…" : "Deploy Token"}
                </button>
              </div>
            </div>

            {/* Info card */}
            <div className="flex flex-col gap-4">
              {/* What happens */}
              <div className="bg-[#151715] border border-[#3a3c3a] rounded-[16px] p-5">
                <h3 className="text-[14px] font-bold text-white mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>
                  What happens when you deploy?
                </h3>
                {[
                  {
                    n: 1,
                    text: "Your ERC-20 contract is compiled and signed locally in your wallet",
                  },
                  {
                    n: 2,
                    text: "The contract is broadcast to Robinhood Chain Mainnet",
                  },
                  {
                    n: 3,
                    text: "Your wallet receives 100% of the initial supply",
                  },
                  {
                    n: 4,
                    text: "The contract is saved and viewable in My Tokens",
                  },
                ].map(({ n, text }) => (
                  <div
                    key={n}
                    className="flex items-start gap-3 mb-3 last:mb-0"
                  >
                    <div className="w-5 h-5 rounded-full bg-[#00C703] text-black text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {n}
                    </div>
                    <p className="text-[13px] text-[#b0b0b0] leading-snug">
                      {text}
                    </p>
                  </div>
                ))}
              </div>

              {/* Quick links */}
              <div className="bg-[#151715] border border-[#3a3c3a] rounded-[16px] p-5">
                <h3 className="text-[13px] font-bold text-[#b0b0b0] uppercase tracking-wider mb-3">
                  Quick Links
                </h3>
                {[
                  {
                    label: "Bridge to RH Chain",
                    href: RH_BRIDGE,
                    desc: "Bridge ETH to Robinhood Chain Mainnet",
                  },
                  {
                    label: "Block Explorer",
                    href: EXPLORER,
                    desc: "View deployed contracts",
                  },
                  {
                    label: "Robinhood Chain Docs",
                    href: "https://docs.robinhood.com/chain/",
                    desc: "Official documentation",
                  },
                  {
                    label: "Deploy Guide (Foundry)",
                    href: "https://docs.robinhood.com/chain/deploy-smart-contracts/",
                    desc: "Advanced deployment",
                  },
                ].map(({ label, href, desc }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between py-2.5 border-b border-[#3a3c3a] last:border-0 group"
                  >
                    <div>
                      <div className="text-[13px] font-semibold text-[#e5e5e5] group-hover:text-[#00C703] transition-colors">
                        {label}
                      </div>
                      <div className="text-[11px] text-[#707070]">{desc}</div>
                    </div>
                    <ExternalLink
                      size={13}
                      className="text-[#707070] group-hover:text-[#00C703] transition-colors"
                    />
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MY TOKENS */}
        {activeTab === "tokens" && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2
                className="text-[18px] font-extrabold text-white"
                style={{ fontFamily: "'Syne', sans-serif" }}
              >
                My Deployed Tokens
              </h2>
              <button
                onClick={() => setActiveTab("create")}
                className="flex items-center gap-2 bg-[#00C703]/10 border border-[#00C703]/30 hover:bg-[#00C703]/20 text-[#00C703] text-[13px] font-semibold px-4 py-2 rounded-full transition-all"
              >
                <Plus size={14} />
                Deploy New
              </button>
            </div>

            {deployedContracts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 border border-[#3a3c3a] rounded-[16px] bg-[#151715]">
                <Coins size={48} className="text-[#3a3c3a] mb-4" />
                <p className="text-[#9a9a9a] text-[15px] font-semibold">
                  No tokens deployed yet
                </p>
                <p className="text-[#707070] text-[13px] mt-1">
                  Create your first token on the Create Token tab
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {deployedContracts.map((token, i) => (
                  <div
                    key={i}
                    className="bg-[#151715] border border-[#3a3c3a] rounded-[14px] p-4 sm:p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#00C703]/10 border border-[#00C703]/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-[#00C703] text-[11px] font-black">
                            {token.symbol.slice(0, 3)}
                          </span>
                        </div>
                        <div>
                          <div className="text-[15px] font-bold text-white">
                            {token.name}
                          </div>
                          <div className="text-[12px] text-[#9a9a9a] font-mono">
                            {token.symbol}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {token.verifyStatus === "verified" && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-[#00C703] bg-[#00C703]/10 border border-[#00C703]/25 px-2 py-0.5 rounded-full">
                            <ShieldCheck size={10} />
                            Verified
                          </span>
                        )}
                        {token.verifyStatus === "pending" && (
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-[#9a9a9a] bg-[#1c1e1c] border border-[#3a3c3a] px-2 py-0.5 rounded-full">
                            <Clock size={10} className="animate-pulse" />
                            Verifying…
                          </span>
                        )}
                        {token.verifyStatus === "failed" && (
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-[#e05555] bg-[#1a0a0a] border border-[#2e1a1a] px-2 py-0.5 rounded-full">
                            <ShieldX size={10} />
                            Unverified
                          </span>
                        )}
                        <span className="text-[11px] text-[#707070] bg-[#1c1e1c] border border-[#3a3c3a] px-2 py-0.5 rounded-full">
                          {token.network}
                        </span>
                        <a
                          href={`${EXPLORER}/address/${token.address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#00C703] hover:text-green-300 transition-colors"
                        >
                          <ExternalLink size={14} />
                        </a>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {[
                        {
                          label: "Supply",
                          value: `${Number(token.supply).toLocaleString()} ${token.symbol}`,
                        },
                        {
                          label: "Deployed",
                          value: new Date(
                            token.deployedAt,
                          ).toLocaleDateString(),
                        },
                        {
                          label: "Contract",
                          value: `${token.address.slice(0, 6)}…${token.address.slice(-4)}`,
                        },
                      ].map(({ label, value }) => (
                        <div
                          key={label}
                          className="bg-[#1c1e1c] border border-[#3a3c3a] rounded-[8px] px-3 py-2"
                        >
                          <div className="text-[10px] text-[#707070] uppercase tracking-wider mb-0.5">
                            {label}
                          </div>
                          <div className="text-[12px] text-[#e5e5e5] font-mono font-semibold">
                            {value}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center gap-4">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(token.address);
                          toast({ title: "Address copied!" });
                        }}
                        className="flex items-center gap-1.5 text-[12px] text-[#9a9a9a] hover:text-[#00C703] transition-colors"
                      >
                        <Copy size={11} />
                        Copy address
                      </button>
                      {token.verifyStatus === "failed" && (
                        <button
                          onClick={() => {
                            const supply = parseUnits(token.supply, 18);
                            const args = encodeAbiParameters(
                              ERC20_CONSTRUCTOR_ABI,
                              [token.name, token.symbol, supply],
                            );
                            setDeployedContracts((prev) => {
                              const next = prev.map((t) =>
                                t.address === token.address
                                  ? { ...t, verifyStatus: "pending" as const }
                                  : t,
                              );
                              saveContracts(next);
                              return next;
                            });
                            verifyOnBlockscout(token.address, args).then(
                              (ok) => {
                                setDeployedContracts((prev) => {
                                  const next = prev.map((t) =>
                                    t.address === token.address
                                      ? {
                                          ...t,
                                          verifyStatus: (ok
                                            ? "verified"
                                            : "failed") as const,
                                        }
                                      : t,
                                  );
                                  saveContracts(next);
                                  return next;
                                });
                                if (ok)
                                  toast({
                                    title:
                                      "✅ Contract verified on Blockscout!",
                                  });
                              },
                            );
                          }}
                          className="flex items-center gap-1.5 text-[12px] text-[#e05555] hover:text-red-300 transition-colors"
                        >
                          <RefreshCw size={11} />
                          Retry verification
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SEND GM */}
        {activeTab === "gm" && (
          <div className="max-w-[480px]">
            <div className="bg-[#151715] border border-[#3a3c3a] rounded-[16px] p-6">
              <div className="text-center mb-6">
                <div className="text-[48px] mb-3">🌅</div>
                <h2 className="text-[22px] font-extrabold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
                  Send GM On-Chain
                </h2>
                <p className="text-[#9a9a9a] text-[13px] mt-2">
                  Send a "Good Morning" message on Robinhood Chain. Once per
                  day, recorded on-chain forever.
                </p>
              </div>

              <NetworkWarning />

              {gmClaimed ? (
                <div className="flex flex-col items-center gap-3 py-4">
                  <div className="flex items-center gap-2 text-[#00C703] text-[15px] font-bold">
                    <CheckCircle size={20} />
                    GM sent today!
                  </div>
                  <p className="text-[#9a9a9a] text-[13px] text-center">
                    Come back tomorrow to send another GM and keep your streak
                    alive.
                  </p>
                  {gmTxHash && (
                    <a
                      href={`${EXPLORER}/tx/${gmTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-[12px] text-[#00C703] hover:text-green-300 transition-colors"
                    >
                      <ExternalLink size={12} />
                      View transaction
                    </a>
                  )}
                </div>
              ) : (
                <button
                  onClick={sendGm}
                  disabled={sendingGm}
                  data-testid="button-send-gm"
                  className="w-full flex items-center justify-center gap-2 bg-[#00C703] hover:bg-[#00e003] disabled:opacity-50 text-black font-bold text-[16px] py-4 rounded-full shadow-[0_0_20px_rgba(0,199,3,0.35)] transition-all active:scale-[0.98]"
                >
                  {sendingGm ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                  {sendingGm ? "Sending…" : "GM 🌅"}
                </button>
              )}

              <div className="mt-5 border-t border-[#3a3c3a] pt-4">
                <div className="text-[11px] text-[#707070] text-center">
                  GM is stored on-chain as{" "}
                  <code className="text-[#9a9a9a]">0x474d</code> (UTF-8
                  encoded). Each GM uses a tiny amount of ETH for gas.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CLAIM XP */}
        {activeTab === "xp" && (
          <div className="max-w-[480px]">
            <div className="bg-[#151715] border border-[#3a3c3a] rounded-[16px] p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-[#00C703]/10 border border-[#00C703]/30 flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(0,199,3,0.15)]">
                  <Gift size={28} className="text-[#00C703]" />
                </div>
                <h2 className="text-[22px] font-extrabold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
                  Claim 25 XP Daily
                </h2>
                <p className="text-[#9a9a9a] text-[13px] mt-2">
                  Claim 25 XP every 24 hours by interacting with the XP contract
                  on Robinhood Chain.
                </p>
              </div>

              {/* XP info */}
              <div className="flex flex-col gap-2 mb-5">
                {[
                  { label: "Daily Reward", value: "25 XP" },
                  {
                    label: "Reset Time",
                    value: "Every 24 hours (midnight UTC)",
                  },
                  { label: "Contract", value: "Announcement pending" },
                  { label: "Network", value: ACTIVE_NETWORK.chainName },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex justify-between items-center py-2 border-b border-[#3a3c3a] last:border-0"
                  >
                    <span className="text-[#9a9a9a] text-[13px]">{label}</span>
                    <span className="text-[#e5e5e5] text-[13px] font-semibold">
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-[10px] px-4 py-3 mb-4">
                <div className="flex items-start gap-2">
                  <Info
                    size={14}
                    className="text-yellow-400 flex-shrink-0 mt-0.5"
                  />
                  <p className="text-yellow-300/80 text-[12px] leading-relaxed">
                    The XP claim contract address will be provided in an
                    official announcement. Check back soon.
                  </p>
                </div>
              </div>

              <button
                onClick={claimXp}
                disabled={claimingXp || xpClaimed}
                data-testid="button-claim-xp"
                className="w-full flex items-center justify-center gap-2 bg-[#00C703] hover:bg-[#00e003] disabled:opacity-40 text-black font-bold text-[15px] py-3.5 rounded-full shadow-[0_0_20px_rgba(0,199,3,0.35)] transition-all"
              >
                {claimingXp ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Gift size={16} />
                )}
                {xpClaimed ? "XP Claimed Today ✓" : "Claim 25 XP"}
              </button>
            </div>
          </div>
        )}

        {/* EXPLORER */}
        {activeTab === "explore" && (
          <div>
            <h2 className="text-[18px] font-extrabold text-white mb-5" style={{ fontFamily: "'Syne', sans-serif" }}>
              Explore Robinhood Chain
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  title: "Block Explorer",
                  desc: "Browse transactions, blocks, addresses, and contracts",
                  href: EXPLORER,
                  icon: Globe,
                  cta: "Open Explorer",
                },
                {
                  title: "Bridge to RH Chain",
                  desc: "Bridge ETH from Base or Ethereum to Robinhood Chain Mainnet",
                  href: RH_BRIDGE,
                  icon: Zap,
                  cta: "Open Bridge",
                },
                {
                  title: "Official Docs",
                  desc: "Full documentation for building on Robinhood Chain",
                  href: "https://docs.robinhood.com/chain/",
                  icon: Info,
                  cta: "Read Docs",
                },
                {
                  title: "Deploy Guide",
                  desc: "Step-by-step Foundry deployment tutorial for developers",
                  href: "https://docs.robinhood.com/chain/deploy-smart-contracts/",
                  icon: Zap,
                  cta: "Deploy with Foundry",
                },
                {
                  title: "Network Info",
                  desc: "RPC endpoints, chain IDs, and connection details",
                  href: "https://docs.robinhood.com/chain/connecting/",
                  icon: RefreshCw,
                  cta: "View Network Details",
                },
                {
                  title: "Robinhood Chain",
                  desc: "Main hub — about the chain, ecosystem, and announcements",
                  href: "https://robinhood.com/us/en/support/articles/robinhood-chain-mainnet/",
                  icon: () => <RobinhoodLogo size={20} />,
                  cta: "Visit robinhood.com",
                },
              ].map(({ title, desc, href, icon: Icon, cta }) => (
                <a
                  key={title}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col bg-[#151715] border border-[#3a3c3a] hover:border-[#00C703]/40 rounded-[14px] p-5 transition-all"
                >
                  <div className="w-10 h-10 rounded-full bg-[#00C703]/10 border border-[#00C703]/20 flex items-center justify-center mb-4 group-hover:bg-[#00C703]/20 transition-all">
                    <Icon size={18} className="text-[#00C703]" />
                  </div>
                  <div className="font-bold text-[15px] text-white mb-1">
                    {title}
                  </div>
                  <div className="text-[12px] text-[#9a9a9a] leading-relaxed flex-1">
                    {desc}
                  </div>
                  <div className="flex items-center gap-1 mt-4 text-[12px] font-semibold text-[#00C703] group-hover:gap-2 transition-all">
                    {cta}
                    <ChevronRight size={13} />
                  </div>
                </a>
              ))}
            </div>

            {/* Network details */}
            <div className="mt-6 bg-[#151715] border border-[#3a3c3a] rounded-[16px] p-5">
              <h3 className="text-[14px] font-bold text-white mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>
                Add to MetaMask / Any EVM Wallet
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: "Network Name", value: ACTIVE_NETWORK.chainName },
                  {
                    label: "Chain ID",
                    value: ACTIVE_NETWORK.chainIdDecimal.toString(),
                  },
                  { label: "RPC URL", value: ACTIVE_NETWORK.rpcUrls[0] },
                  { label: "Currency", value: "ETH" },
                  {
                    label: "Explorer",
                    value: ACTIVE_NETWORK.blockExplorerUrls[0],
                  },
                ].map(({ label, value }) => (
                  <div key={label} className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#707070]">
                      {label}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] text-[#e5e5e5] font-mono break-all">
                        {value}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(value);
                          toast({ title: "Copied!" });
                        }}
                        className="text-[#707070] hover:text-[#00C703] transition-colors flex-shrink-0"
                      >
                        <Copy size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={switchToRH}
                disabled={switchingNetwork || isOnRH}
                className="mt-5 flex items-center gap-2 bg-[#00C703] hover:bg-[#00e003] disabled:opacity-50 text-black font-bold text-[13px] px-5 py-2.5 rounded-full shadow-[0_0_16px_rgba(0,199,3,0.3)] transition-all"
              >
                {switchingNetwork && (
                  <Loader2 size={13} className="animate-spin" />
                )}
                {isOnRH
                  ? "✓ Already on Robinhood Chain"
                  : "Add Robinhood Chain to Wallet"}
              </button>
            </div>
          </div>
        )}
      </div>

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
