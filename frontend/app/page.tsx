"use client";

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import { STAKING_CONTRACT_ADDRESS, STAKING_ABI, STAKING_TOKEN_ADDRESS } from '../constants';
import { useState } from 'react';
import { STAKING_TOKEN_ABI } from '@/constants/abi';

export default function Home() {
  const { isConnected } = useAccount();
  const [stakeAmount, setStakeAmount] = useState("");

  // Fetch Total Value Locked (Requirement 13)
  const { data: tvl } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI,
    functionName: 'totalStaked',
  });

  // Fetch Pool 0 Info (Flexible)
  const { data: pool0 } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI,
    functionName: 'pools',
    args: [BigInt(0)],
  });

const { writeContractAsync } = useWriteContract();

const handleStake = async () => {
  if (!stakeAmount) return;
  const amount = parseEther(stakeAmount);

  try {
    // Step 1: Send Approval
    const approvalHash = await writeContractAsync({
      address: STAKING_TOKEN_ADDRESS,
      abi: STAKING_TOKEN_ABI,
      functionName: 'approve',
      args: [STAKING_CONTRACT_ADDRESS, amount],
    });

    // IMPORTANT: You must wait for the block to include this transaction
    alert("Approval sent! Please wait for confirmation...");
    
    // Step 2: Send Stake (Trigger this manually or via a useEffect hook after confirmation)
    await writeContractAsync({
      address: STAKING_CONTRACT_ADDRESS,
      abi: STAKING_ABI,
      functionName: 'stake',
      args: [BigInt(0), amount],
    });

  } catch (error) {
    console.error("Interaction failed:", error);
  }
};

  return (
    <div className="min-h-screen p-8 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <nav className="flex justify-between items-center mb-12 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold">Staking Protocol</h1>
        {/* Requirement 12: Wallet Connect Button */}
        <div data-testid="connect-wallet-button">
          <ConnectButton />
        </div>
      </nav>

      <main className="max-w-5xl mx-auto grid gap-8">
        {/* Requirement 13: Dashboard Stats */}
        <section className="p-8 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800">
          <h2 className="text-zinc-500 text-sm font-semibold uppercase tracking-wider mb-2">Total Value Locked</h2>
          <p className="text-5xl font-mono font-bold" data-testid="total-value-locked">
            {tvl ? formatEther(tvl) : "0"} STK
          </p>
        </section>

        {isConnected ? (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Flexible Pool Card */}
            <div data-testid="pool-item-0" className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold">Flexible Pool</h3>
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-bold">Active</span>
              </div>
              
              <div className="space-y-2 mb-6">
                <p className="flex justify-between">
                  <span className="text-zinc-500">APY</span>
                  <span className="font-mono font-bold" data-testid="pool-apy-0">
                    {pool0 ? pool0[0].toString() : "0"}%
                  </span>
                </p>
                <p className="flex justify-between">
                  <span className="text-zinc-500">Lock Duration</span>
                  <span className="font-mono" data-testid="pool-duration-0">0 Days</span>
                </p>
              </div>

              {/* Requirement 14: Interaction */}
              <div className="space-y-3">
                <input 
                  data-testid="stake-amount-input"
                  type="number"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  placeholder="Amount to stake"
                  className="w-full p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
                <button 
                  data-testid="stake-button"
                  onClick={handleStake}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors"
                >
                  Stake Tokens
                </button>
              </div>
            </div>

            {/* Locked Pool Placeholder (Pool 1) */}
            <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 opacity-75">
               <h3 className="text-xl font-bold mb-4">Locked Pool (30 Days)</h3>
               <p className="text-zinc-500">Connect to view details.</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-20 bg-zinc-100 dark:bg-zinc-900 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-800">
            <p className="text-zinc-500">Please connect your wallet to view pools and stake tokens.</p>
          </div>
        )}
      </main>
    </div>
  );
}