"use client";

import WalletButton from "@/components/WalletButton";
import PoolList from "@/components/PoolList";
import StakePanel from "@/components/StakePanel";
import UserPositions from "@/components/UserPositions";
import { useState, useCallback } from "react";
import { motion } from "framer-motion";

export default function Home() {
  const [account, setAccount] = useState<string | null>(null);
  const [selectedPoolId, setSelectedPoolId] = useState<number>(0);

  const handlePoolSelect = useCallback((poolId: number) => {
    setSelectedPoolId(poolId);
  }, []);

  return (
    <main className="min-h-screen pt-8 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Navigation & Header */}
        <motion.nav
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-center gap-6 glass px-6 py-4 rounded-2xl"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">DeFi <span className="text-gradient">Staking</span></h1>
          </div>

          <WalletButton onConnect={setAccount} />
        </motion.nav>

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="text-center max-w-3xl mx-auto space-y-4 py-8"
        >
          <h2 className="text-5xl font-extrabold tracking-tight sm:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">
            Maximize Your Yield
          </h2>
          <p className="text-lg text-gray-400">
            Stake your tokens securely and earn robust rewards. Choose between flexible pools for liquidity or locked pools for higher APY.
          </p>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">

          {/* Left Column: Pools */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-7 space-y-8"
          >
            <div className="flex items-end justify-between mb-2">
              <h3 className="text-2xl font-semibold flex items-center gap-2">
                <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
                Staking Pools
              </h3>
            </div>
            <PoolList selectedPoolId={selectedPoolId} onSelect={handlePoolSelect} />
          </motion.div>

          {/* Right Column: Staking Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-5 sticky top-8"
          >
            <StakePanel poolId={selectedPoolId} account={account} />
          </motion.div>
        </div>

        {/* Bottom Section: User Positions */}
        {account && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="pt-8 border-t border-white/10"
          >
            <h3 className="text-2xl font-semibold flex items-center gap-2 mb-6">
              <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              My Active Positions
            </h3>
            <UserPositions account={account} />
          </motion.div>
        )}
      </div>
    </main>
  );
}