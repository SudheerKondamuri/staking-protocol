"use client";

import { useEffect, useState, useCallback } from "react";
import { getStakingContract } from "@/lib/contracts";
import { ethers } from "ethers";
import { motion, AnimatePresence } from "framer-motion";
import { formatNumber } from "@/lib/utils";
import { toast } from "sonner";
import { Loader2, AlertTriangle, Download, HandCoins, Activity, Clock } from "lucide-react";

export default function UserPositions({ account }: { account: string }) {
  const [positions, setPositions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState<{ id: number, action: string } | null>(null);

  const loadPositions = useCallback(async () => {
    try {
      const contract = await getStakingContract();
      const ids = await contract.getUserPositions(account);

      const data = [];

      for (const id of ids) {
        const pos = await contract.positions(id);
        if (!pos.isActive) continue; // Only show active positions

        const rewards = await contract.getPendingRewards(id);
        const poolInfo = await contract.getPoolInfo(pos.poolId);

        data.push({
          id: Number(id),
          poolId: Number(pos.poolId),
          amount: pos.amount, // Keep as BigInt for precise formatting
          startTime: Number(pos.startTime),
          isActive: pos.isActive,
          pendingRewards: rewards, // Keep as BigInt
          isFlexible: poolInfo.isFlexible,
          lockDuration: Number(poolInfo.lockDuration),
        });
      }

      setPositions(data);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load positions");
    } finally {
      setIsLoading(false);
    }
  }, [account]);

  useEffect(() => {
    if (account) loadPositions();
  }, [account, loadPositions]);

  const handleAction = async (id: number, actionName: string, actionFn: (contract: any) => Promise<any>, successMsg: string) => {
    setLoadingAction({ id, action: actionName });
    const toastId = toast.loading(`Processing ${actionName.replace('-', ' ')}...`);

    try {
      const contract = await getStakingContract();
      const tx = await actionFn(contract);
      await tx.wait();
      toast.success(successMsg, { id: toastId });
      loadPositions();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || `Failed to execute ${actionName}`, { id: toastId });
    } finally {
      setLoadingAction(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12 glass-card border border-white/5">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!positions.length) {
    return (
      <div className="text-center py-12 glass-card border border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
        <Activity className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <h4 className="text-lg font-medium text-gray-300 mb-1">No Active Positions</h4>
        <p className="text-sm text-gray-500 max-w-sm mx-auto">
          You don't have any active stakes right now. Select a pool above and stake tokens to start earning rewards.
        </p>
      </div>
    );
  }

  return (
    <div data-testid="user-positions-list" className="space-y-4">
      <AnimatePresence>
        {positions.map((pos, index) => {
          const isLocked = !pos.isFlexible;
          const unlockTime = pos.startTime + pos.lockDuration;
          const isUnlocked = Date.now() / 1000 >= unlockTime;

          return (
            <motion.div
              key={pos.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.1 }}
              data-testid={`position-item-${pos.id}`}
              className="glass-card border border-white/10 p-0 overflow-hidden"
            >
              {/* Card Header */}
              <div className="bg-black/20 px-6 py-4 border-b border-white/10 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                    #{pos.id}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-300">Pool {pos.poolId}</p>
                    {isLocked && !isUnlocked && (
                      <p className="text-xs text-orange-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        Locked until {new Date(unlockTime * 1000).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Body - Metrics */}
              <div className="px-6 py-5 grid sm:grid-cols-2 gap-6 bg-gradient-to-br from-transparent to-white/[0.02]">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Staked Amount</p>
                  <p className="text-2xl font-semibold">{formatNumber(pos.amount, 18)} <span className="text-base font-normal text-gray-400">STK</span></p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Pending Rewards</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-semibold text-secondary">{pos.pendingRewards ? formatNumber(pos.pendingRewards, 18) : "0"}</p>
                    <span className="text-base text-gray-400">RWD</span>
                  </div>
                </div>
              </div>

              {/* Card Actions */}
              <div className="px-6 py-4 bg-black/40 border-t border-white/5 flex flex-wrap gap-3">
                <button
                  data-testid={`claim-button-${pos.id}`}
                  disabled={loadingAction?.id === pos.id || Number(pos.pendingRewards) === 0}
                  onClick={() => handleAction(pos.id, 'claim', c => c.claimRewards(pos.id), 'Rewards claimed!')}
                  className="btn-secondary flex-1 sm:flex-none flex items-center justify-center gap-2"
                >
                  {loadingAction?.id === pos.id && loadingAction?.action === 'claim' ? <Loader2 className="w-4 h-4 animate-spin" /> : <HandCoins className="w-4 h-4 text-green-400" />}
                  Claim
                </button>

                <button
                  data-testid={`unstake-button-${pos.id}`}
                  disabled={loadingAction?.id === pos.id || (isLocked && !isUnlocked)}
                  onClick={() => handleAction(pos.id, 'unstake', c => c.unstake(pos.id), 'Successfully unstaked!')}
                  className="btn-secondary flex-1 sm:flex-none flex items-center justify-center gap-2"
                  title={isLocked && !isUnlocked ? "Locked period not over" : ""}
                >
                  {loadingAction?.id === pos.id && loadingAction?.action === 'unstake' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 text-primary" />}
                  Unstake
                </button>

                {isLocked && !isUnlocked && (
                  <button
                    disabled={loadingAction?.id === pos.id}
                    onClick={() => handleAction(pos.id, 'early-withdraw', c => c.withdrawEarly(pos.id), 'Early withdrawal complete. Penalty applied.')}
                    className="btn-danger flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-orange-600 to-orange-500 opacity-90 hover:opacity-100 text-sm py-2 px-3"
                  >
                    {loadingAction?.id === pos.id && loadingAction?.action === 'early-withdraw' ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
                    Early Withdraw
                  </button>
                )}

                <button
                  disabled={loadingAction?.id === pos.id}
                  onClick={() => handleAction(pos.id, 'emergency-withdraw', c => c.emergencyWithdraw(pos.id), 'Emergency withdrawal complete. Rewards forfeited.')}
                  className="btn-danger flex-1 sm:flex-none flex items-center justify-center gap-2 ml-auto text-sm py-2 px-3 bg-red-950/50 border border-red-500/30 text-red-500 hover:bg-red-900/40 hover:text-red-400 shadow-none hover:shadow-none"
                  title="Withdraw principal completely, forfeit all rewards"
                >
                  {loadingAction?.id === pos.id && loadingAction?.action === 'emergency-withdraw' ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
                  Emergency
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}