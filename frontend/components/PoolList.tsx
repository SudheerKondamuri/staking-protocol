"use client";

import { usePools, useTVL } from "@/hooks/useStaking";
import { motion } from "framer-motion";
import { formatNumber } from "@/lib/utils";
import { Coins, Lock, Unlock, ArrowUpRight } from "lucide-react";
import clsx from "clsx";

interface PoolListProps {
  selectedPoolId: number;
  onSelect: (poolId: number) => void;
}

export default function PoolList({ selectedPoolId, onSelect }: PoolListProps) {
  const { data: pools, isLoading: isPoolsLoading } = usePools();
  const { data: tvl, isLoading: isTvlLoading } = useTVL();

  return (
    <div className="space-y-6">
      {/* TVL Metric Card */}
      <motion.div
        whileHover={{ y: -2 }}
        className="glass-card relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-2">
              <Coins className="w-4 h-4 text-primary" />
              Total Value Locked
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400" data-testid="total-value-locked">
                {isTvlLoading ? "..." : (tvl ? Number(tvl).toLocaleString(undefined, { maximumFractionDigits: 2 }) : "0")}
              </span>
              <span className="text-xl text-primary font-semibold">STK</span>
            </div>
          </div>
          <div className="hidden sm:flex w-12 h-12 rounded-full bg-white/5 items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
            <ArrowUpRight className="w-6 h-6 text-primary" />
          </div>
        </div>
      </motion.div>

      {/* Pools Grid */}
      <div className="grid sm:grid-cols-2 gap-4">
        {isPoolsLoading ? (
          <div className="col-span-2 text-center py-10 text-gray-400">Loading pools...</div>
        ) : pools?.length === 0 ? (
          <div className="col-span-2 text-center py-10 text-gray-400 glass-card">No pools available.</div>
        ) : (
          pools?.map((pool: any, index: number) => {
            const isFlexible = pool?.isFlexible || pool?.lockDuration?.toString() === "0";
            const isSelected = selectedPoolId === pool?.id;

            return (
              <motion.div
                key={pool?.id || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                data-testid={`pool-item-${pool?.id}`}
                onClick={() => onSelect(pool?.id)}
                className={clsx(
                  "glass-card cursor-pointer transition-all duration-300 relative overflow-hidden group border",
                  isSelected
                    ? "border-primary shadow-[0_0_30px_-5px_var(--color-primary)] bg-gray-900/80 scale-[1.02]"
                    : "border-white/5 hover:border-white/20"
                )}
              >
                {/* Selection Indicator Background */}
                {isSelected && (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
                )}

                <div className="flex justify-between items-start mb-6 relative z-10">
                  <div className={clsx(
                    "px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 tracking-wide",
                    isFlexible ? "bg-secondary/20 text-secondary" : "bg-primary/20 text-primary"
                  )}>
                    {isFlexible ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                    {isFlexible ? "Flexible" : "Locked"}
                  </div>

                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center animate-in zoom-in">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>

                <div className="space-y-4 relative z-10">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">APY Rate</p>
                    <div className="text-3xl font-bold flex items-baseline gap-1" data-testid={`pool-apy-${pool?.id}`}>
                      {pool?.apyRate?.toString() || "0"}
                      <span className="text-lg text-gray-400">%</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-end pb-2 border-b border-white/10">
                    <span className="text-sm text-gray-400">Lock Duration</span>
                    <span className="font-semibold" data-testid={`pool-duration-${pool?.id}`}>
                      {pool?.lockDuration?.toString() || "0"} sec
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-sm pt-2">
                    <span className="text-gray-400">Total Staked</span>
                    <span className="font-medium text-white">{pool?.totalStaked ? formatNumber(pool.totalStaked) : "0"} STK</span>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}