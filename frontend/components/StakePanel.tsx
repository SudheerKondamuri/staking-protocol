"use client";

import { useState } from "react";
import { ethers } from "ethers";
import { getStakingContract, getStakingTokenContract } from "@/lib/contracts";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Loader2, ArrowRight } from "lucide-react";

export default function StakePanel({ poolId, account, onStaked }: { poolId: number, account: string | null, onStaked?: () => void }) {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("");
  const [isStaking, setIsStaking] = useState(false);

  const stake = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setIsStaking(true);
    const toastId = toast.loading("Initiating staking transaction...");

    try {
      const parsed = ethers.parseUnits(amount, 18);

      // Get Contracts
      const token = await getStakingTokenContract();
      const staking = await getStakingContract();

      // Check allowance first to avoid unnecessary approve transactions
      toast.loading("Checking STK allowance...", { id: toastId });
      const currentAllowance = await token.allowance(account, process.env.NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS!);

      if (currentAllowance < parsed) {
        toast.loading("Approving STK tokens...", { id: toastId });
        const approveTx = await token.approve(
          process.env.NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS!,
          parsed
        );
        await approveTx.wait();
      }

      toast.loading("Confirming stake transaction...", { id: toastId });
      const tx = await staking.stake(poolId, parsed);
      await tx.wait();

      toast.success(`Successfully staked ${amount} STK!`, { id: toastId });
      setAmount("");
      queryClient.invalidateQueries({ queryKey: ["pools"] });
      queryClient.invalidateQueries({ queryKey: ["tvl"] });
      onStaked?.();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.reason || error?.message || "Staking failed. Please try again.", { id: toastId });
    } finally {
      setIsStaking(false);
    }
  };

  return (
    <div className="glass-card flex flex-col h-full bg-gradient-to-b from-gray-900/90 to-gray-900 border border-white/5">
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">Stake Tokens</h3>
        <p className="text-sm text-gray-400">
          Enter the amount of STK you want to stake into Pool #{poolId}.
        </p>
      </div>

      <div className="space-y-6 flex-grow">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Amount (STK)</label>
          <div className="relative">
            <input
              type="number"
              min="0"
              step="0.01"
              data-testid="stake-amount-input"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-4 pr-20 text-lg font-medium outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-gray-600"
              placeholder="0.00"
              disabled={isStaking || !account}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <span className="text-sm font-bold text-gray-500">STK</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-white/5">
        {!account ? (
          <div className="w-full py-4 text-center text-sm text-gray-400 bg-white/5 rounded-xl border border-white/5 overflow-hidden relative">
            <div className="absolute inset-0 bg-primary/5 animate-pulse" />
            <span className="relative z-10">Please connect wallet to stake</span>
          </div>
        ) : (
          <button
            data-testid="stake-button"
            onClick={stake}
            disabled={isStaking || !amount || Number(amount) <= 0}
            className="w-full btn-primary flex justify-center items-center gap-2 py-4 text-lg"
          >
            {isStaking ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Confirm Stake
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}