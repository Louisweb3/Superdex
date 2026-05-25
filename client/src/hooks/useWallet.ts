import { useState, useEffect, useCallback } from "react";
import { BASE_CHAIN_ID, BASE_CHAIN_HEX } from "@/lib/tokens";

export interface WalletState {
  address: string | null;
  chainId: number | null;
  balance: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  isWrongNetwork: boolean;
  error: string | null;
}

declare global {
  interface Window {
    ethereum?: any;
  }
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    address: null,
    chainId: null,
    balance: null,
    isConnected: false,
    isConnecting: false,
    isWrongNetwork: false,
    error: null,
  });

  const updateState = (patch: Partial<WalletState>) =>
    setState((s) => ({ ...s, ...patch }));

  const fetchBalance = useCallback(async (addr: string) => {
    if (!window.ethereum || !addr) return;
    try {
      const balHex: string = await window.ethereum.request({
        method: "eth_getBalance",
        params: [addr, "latest"],
      });
      const balWei = parseInt(balHex, 16);
      const balEth = (balWei / 1e18).toFixed(4);
      updateState({ balance: balEth });
    } catch {
      // balance fetch failed, ignore
    }
  }, []);

  const checkConnection = useCallback(async () => {
    if (!window.ethereum) return;
    try {
      const accounts: string[] = await window.ethereum.request({ method: "eth_accounts" });
      const chainIdHex: string = await window.ethereum.request({ method: "eth_chainId" });
      const chainId = parseInt(chainIdHex, 16);
      if (accounts.length > 0) {
        updateState({
          address: accounts[0],
          chainId,
          isConnected: true,
          isWrongNetwork: chainId !== BASE_CHAIN_ID,
          error: null,
        });
        await fetchBalance(accounts[0]);
      }
    } catch {
      // not connected yet
    }
  }, [fetchBalance]);

  useEffect(() => {
    checkConnection();
    if (!window.ethereum) return;
    const onAccounts = (accounts: string[]) => {
      if (accounts.length === 0) {
        setState({ address: null, chainId: null, balance: null, isConnected: false, isConnecting: false, isWrongNetwork: false, error: null });
      } else {
        updateState({ address: accounts[0], isConnected: true, error: null });
        fetchBalance(accounts[0]);
      }
    };
    const onChainChanged = (chainIdHex: string) => {
      const chainId = parseInt(chainIdHex, 16);
      updateState({ chainId, isWrongNetwork: chainId !== BASE_CHAIN_ID });
      if (state.address) fetchBalance(state.address);
    };
    window.ethereum.on("accountsChanged", onAccounts);
    window.ethereum.on("chainChanged", onChainChanged);
    return () => {
      window.ethereum?.removeListener("accountsChanged", onAccounts);
      window.ethereum?.removeListener("chainChanged", onChainChanged);
    };
  }, [checkConnection]);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      updateState({ error: "No wallet found. Install MetaMask or Coinbase Wallet." });
      return;
    }
    updateState({ isConnecting: true, error: null });
    try {
      const accounts: string[] = await window.ethereum.request({ method: "eth_requestAccounts" });
      const chainIdHex: string = await window.ethereum.request({ method: "eth_chainId" });
      const chainId = parseInt(chainIdHex, 16);
      updateState({
        address: accounts[0],
        chainId,
        isConnected: true,
        isConnecting: false,
        isWrongNetwork: chainId !== BASE_CHAIN_ID,
        error: null,
      });
      await fetchBalance(accounts[0]);
    } catch (err: any) {
      updateState({ isConnecting: false, error: err.message ?? "Connection rejected" });
    }
  }, []);

  const switchToBase = useCallback(async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: BASE_CHAIN_HEX }],
      });
    } catch (err: any) {
      if (err.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: BASE_CHAIN_HEX,
              chainName: "Base",
              nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
              rpcUrls: ["https://mainnet.base.org"],
              blockExplorerUrls: ["https://basescan.org"],
            }],
          });
        } catch {
          updateState({ error: "Failed to add Base network" });
        }
      }
    }
  }, []);

  const disconnect = useCallback(() => {
    setState({ address: null, chainId: null, balance: null, isConnected: false, isConnecting: false, isWrongNetwork: false, error: null });
  }, []);

  const sendTransaction = useCallback(async (tx: { to: string; data: string; value?: string; gas?: string }) => {
    if (!window.ethereum || !state.address) throw new Error("Wallet not connected");
    const txHash: string = await window.ethereum.request({
      method: "eth_sendTransaction",
      params: [{ from: state.address, ...tx }],
    });
    return txHash;
  }, [state.address]);

  return { ...state, connect, disconnect, switchToBase, sendTransaction };
}
