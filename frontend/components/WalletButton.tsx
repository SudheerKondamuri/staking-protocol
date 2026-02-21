"use client";

import { useEffect, useState, useCallback } from "react";
import { getBrowserProvider } from "@/lib/provider";
import { Wallet, LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function WalletButton({ onConnect }: { onConnect?: (account: string | null) => void }) {
  const [account, setAccount] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Listen for account changes from MetaMask
  const handleAccountsChanged = useCallback((accounts: string[]) => {
    if (accounts.length > 0) {
      setAccount(accounts[0]);
      onConnect?.(accounts[0]);
    } else {
      setAccount(null);
      onConnect?.(null);
    }
  }, [onConnect]);

  useEffect(() => {
    // Check if already connected on load
    const checkConnection = async () => {
      try {
        const provider = getBrowserProvider();
        const accounts = await provider.send("eth_accounts", []);
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          onConnect?.(accounts[0]);
        }

        // Setup listener
        if (typeof window !== "undefined" && (window as any).ethereum) {
          (window as any).ethereum.on("accountsChanged", handleAccountsChanged);
        }
      } catch (e) {
        console.log("Not connected yet");
      }
    };
    checkConnection();

    return () => {
      if (typeof window !== "undefined" && (window as any).ethereum) {
        (window as any).ethereum.removeListener("accountsChanged", handleAccountsChanged);
      }
    };
  }, [handleAccountsChanged]);

  const connect = async () => {
    setIsConnecting(true);
    try {
      const provider = getBrowserProvider();
      // Force MetaMask to show the account selection popup by requesting permissions
      await provider.send("wallet_requestPermissions", [{ eth_accounts: {} }]);
      const accounts = await provider.send("eth_requestAccounts", []);

      setAccount(accounts[0]);
      onConnect?.(accounts[0]);
      toast.success("Wallet connected successfully!");
    } catch (error: any) {
      if (error?.code !== 4001) { // 4001 is user rejected
        toast.error(error?.message || "Failed to connect wallet.");
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setAccount(null);
    onConnect?.(null);
    toast.info("Wallet disconnected in app. To fully disconnect, please remove connection in MetaMask.");
  };

  if (!account) {
    return (
      <button
        data-testid="connect-wallet-button"
        onClick={connect}
        disabled={isConnecting}
        className="btn-primary flex items-center gap-2 relative overflow-hidden group"
      >
        <div className="absolute inset-0 w-full h-full bg-white/20 transform -skew-x-12 -translate-x-full group-hover:animate-[shimmer_1s_forwards]" />
        {isConnecting ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Wallet className="w-5 h-5" />
        )}
        <span>{isConnecting ? "Connecting..." : "Connect Wallet"}</span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 p-1.5 pr-4 glass rounded-full border border-white/10 shadow-lg">
      <div className="bg-gradient-to-br from-primary to-accent p-2 rounded-full">
        <Wallet className="w-4 h-4 text-white" />
      </div>
      <div data-testid="connected-account-address" className="font-mono text-sm tracking-widest px-2 font-medium">
        {account.slice(0, 6)}...{account.slice(-4)}
      </div>
      <button
        onClick={disconnect}
        className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-red-400 ml-2"
        title="Disconnect Layer"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  );
}