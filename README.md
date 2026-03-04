# ⚡ DeFi Staking Protocol

A full-stack decentralized staking protocol built with **Solidity**, **Hardhat**, and **Next.js**. Users stake ERC-20 tokens (STK) into pools and earn rewards in a separate ERC-20 token (RWD) based on a configurable APY rate. The protocol supports flexible and locked pools, early withdrawal penalties, and emergency withdrawals.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [How Staking Works](#how-staking-works)
- [Reward Formula](#reward-formula)
- [Smart Contracts](#smart-contracts)
- [Default Pools](#default-pools)
- [Frontend](#frontend)
- [Getting Started](#getting-started)
- [Docker Setup](#docker-setup)
- [Project Structure](#project-structure)
- [Contract API Reference](#contract-api-reference)
- [Security](#security)
- [Troubleshooting](#troubleshooting)

---

## Overview

This project demonstrates a complete DeFi staking flow:

1. **Owner** deploys the protocol and creates staking pools with different APY rates and lock durations.
2. **Users** connect their wallet (MetaMask), stake STK tokens into a pool, and earn RWD tokens over time.
3. Rewards accrue linearly every second based on the pool's APY rate.
4. Users can claim rewards, unstake (after the lock period), or early-withdraw with a 10% penalty.

### Key Features

- **Dual-token model** — Stake with STK, earn with RWD (separate ERC-20 tokens)
- **Flexible pools** — Stake/unstake anytime, lower APY
- **Locked pools** — Higher APY, tokens locked for a set duration
- **Early withdrawal** — Exit locked pools before expiry with a 10% penalty on principal
- **Emergency withdrawal** — Recover principal at any time, forfeit all rewards
- **Pausable** — Owner can pause/unpause the protocol
- **Reentrancy protection** — All state-changing functions use OpenZeppelin's `ReentrancyGuard`
- **Real-time frontend** — Next.js app with live pool data, staking UI, and position management

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Frontend (Next.js)                │
│  ┌───────────┐  ┌────────────┐  ┌────────────────┐  │
│  │ PoolList   │  │ StakePanel │  │ UserPositions  │  │
│  └─────┬─────┘  └──────┬─────┘  └───────┬────────┘  │
│        │               │                │            │
│        ▼               ▼                ▼            │
│  ┌─────────────────────────────────────────────────┐ │
│  │           ethers.js (JsonRpcProvider)           │ │
│  └──────────────────────┬──────────────────────────┘ │
└─────────────────────────┼───────────────────────────┘
                          │ JSON-RPC
                          ▼
┌─────────────────────────────────────────────────────┐
│                  Hardhat Node (:8545)                │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐  │
│  │ StakingToken │  │ RewardToken  │  │  Staking   │  │
│  │    (STK)     │  │    (RWD)     │  │  Protocol  │  │
│  └──────────────┘  └──────────────┘  └───────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## How Staking Works

### Flow

```
User approves STK → User calls stake(poolId, amount)
  → STK transferred to protocol contract
  → Position created with startTime = now
  → Rewards accrue every second based on APY

User calls claimRewards(positionId)
  → Pending RWD calculated and transferred
  → lastRewardClaimTime reset to now

User calls unstake(positionId)  [after lock expires, or flexible]
  → Principal (STK) returned + pending RWD transferred
  → Position deactivated
```

### Pool Types

| Type     | Lock Period | APY | Early Withdrawal | Description                               |
| -------- | ----------- | --- | ---------------- | ----------------------------------------- |
| Flexible | None        | 10% | N/A              | Stake/unstake anytime, rewards accrue     |
| Locked   | 30 days     | 15% | 10% penalty      | Higher APY, principal locked until expiry |

### Early Withdrawal (Locked Pools Only)

If a user exits a locked pool before the lock period ends:

- **10% penalty** is deducted from their principal
- The penalty is sent to the contract owner
- **No rewards** are paid out

### Emergency Withdrawal

Available on any pool, even when paused:

- Returns **principal only** (STK), no rewards
- **All pending rewards are forfeited**
- Bypasses the pause check — always available as a safety mechanism

---

## Reward Formula

Rewards are calculated using a simple linear interest formula:

$$
\text{rewards} = \frac{\text{stakedAmount} \times \text{apyRate} \times \text{timeElapsed}}{\text{SECONDS\_IN\_YEAR} \times 100}
$$

Where:

- **stakedAmount** — Amount of STK tokens staked (in wei, 18 decimals)
- **apyRate** — Pool's annual percentage yield (e.g., `10` = 10%, `15` = 15%)
- **timeElapsed** — Seconds since last reward claim (`block.timestamp - lastRewardClaimTime`)
- **SECONDS_IN_YEAR** — Constant: `31,536,000` (365 days)

### Example

Stake **1,000 STK** in a pool with **10% APY**:

| Duration | Calculation                                                  | Reward (RWD) |
| -------- | ------------------------------------------------------------ | ------------ |
| 1 day    | $\frac{1000 \times 10 \times 86400}{31536000 \times 100}$    | ≈ 0.274      |
| 30 days  | $\frac{1000 \times 10 \times 2592000}{31536000 \times 100}$  | ≈ 8.219      |
| 1 year   | $\frac{1000 \times 10 \times 31536000}{31536000 \times 100}$ | 100.0        |

> **Note:** The APY rate maps 1:1 between token denominations. "10% APY" means for every 1 STK staked, you earn 0.1 RWD per year. Both tokens use 18 decimals.

### Early Withdrawal Penalty Formula

$$
\text{penalty} = \frac{\text{stakedAmount} \times 10}{100}
$$

$$
\text{returnedToUser} = \text{stakedAmount} - \text{penalty}
$$

---

## Smart Contracts

All contracts are written in Solidity `^0.8.20` and use [OpenZeppelin v5](https://docs.openzeppelin.com/contracts/5.x/) libraries.

### StakingToken (STK)

Standard ERC-20 token. Mints **1,000,000 STK** to the deployer on construction. Used as the staking asset.

### RewardToken (RWD)

Standard ERC-20 token. Mints **1,000,000 RWD** to the deployer on construction. During deployment, all RWD tokens are transferred to the `StakingProtocol` contract to fund reward payouts.

### StakingProtocol

The core contract. Inherits:

- `Ownable` — Owner-only pool creation, pause/unpause
- `Pausable` — Circuit breaker for stake/unstake/claim
- `ReentrancyGuard` — Protection against reentrancy attacks

---

## Default Pools

The deployment script automatically creates two pools:

| Pool ID | Type     | APY Rate | Lock Duration           | Created By    |
| ------- | -------- | -------- | ----------------------- | ------------- |
| 0       | Flexible | 10%      | 0 (none)                | Deploy script |
| 1       | Locked   | 15%      | 30 days (2,592,000 sec) | Deploy script |

The owner can create additional pools after deployment by calling `createPool(apyRate, lockDuration, isFlexible)`.

---

## Frontend

The frontend is a **Next.js 16** app built with:

- **React 19** + **TypeScript**
- **ethers.js v6** — Blockchain interaction
- **TanStack React Query** — Data fetching and cache management
- **Tailwind CSS v4** — Styling
- **Framer Motion** — Animations
- **Sonner** — Toast notifications
- **Lucide React** — Icons

### Pages & Components

| Component       | Description                                                             |
| --------------- | ----------------------------------------------------------------------- |
| `PoolList`      | Displays all staking pools with APY, lock duration, and total staked    |
| `StakePanel`    | Input form to stake STK tokens into the selected pool                   |
| `UserPositions` | Lists user's active positions with claim, unstake, and withdraw actions |
| `WalletButton`  | Connect/disconnect MetaMask wallet                                      |

### Data Flow

- **Read operations** (pools, TVL) use a **read-only `JsonRpcProvider`** — no wallet needed
- **Write operations** (stake, claim, unstake) use a **`BrowserProvider`** from MetaMask
- After any transaction, React Query caches for `pools` and `tvl` are invalidated for instant UI updates

---

## Getting Started

### Prerequisites

- **Node.js** >= 18.x
- **npm** (comes with Node.js)
- **MetaMask** browser extension (for the frontend)

### 1. Install Dependencies

```bash
# Root (Hardhat + contracts)
npm install

# Frontend (Next.js)
cd frontend && npm install && cd ..
```

### 2. Start Hardhat Local Node

```bash
npx hardhat node
```

This starts a local Ethereum node at `http://localhost:8545` with pre-funded accounts.

### 3. Deploy Contracts

In a new terminal:

```bash
npx hardhat deploy --network localhost
```

This will:

- Deploy **StakingToken**, **RewardToken**, and **StakingProtocol**
- Transfer 1,000,000 RWD to the protocol for reward payouts
- Create 2 default pools (Flexible 10% APY + Locked 15% APY)
- Output deployed addresses to the console

### 4. Configure Frontend Environment

Create or update `frontend/.env` with the deployed addresses:

```env
NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
NEXT_PUBLIC_STAKING_TOKEN_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
NEXT_PUBLIC_RPC_URL=http://localhost:8545
```

> The addresses above are the default Hardhat deterministic addresses. If you redeploy, update them from the deploy output.

### 5. Start the Frontend

```bash
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Connect MetaMask

1. Open MetaMask → Add Network → Add manually:
   - **Network Name:** Hardhat Local
   - **RPC URL:** `http://localhost:8545`
   - **Chain ID:** `31337`
   - **Currency Symbol:** ETH
2. Import a Hardhat test account using its private key (printed when you run `npx hardhat node`)
3. Click **Connect Wallet** in the app

---

## Docker Setup

Run the entire stack (Hardhat node + contract deployment + Next.js frontend) with a single command:

```bash
docker-compose up --build
```

This will:

1. **hardhat-node** container — Starts a Hardhat node, deploys all contracts, writes deployed addresses to a shared volume
2. **frontend** container — Waits for deployment to finish, picks up contract addresses from the shared volume, starts Next.js dev server

The app will be available at [http://localhost:3000](http://localhost:3000) and the RPC node at [http://localhost:8545](http://localhost:8545).

To tear down:

```bash
docker-compose down -v
```

---

## Project Structure

```
staking-protocol/
├── contracts/                    # Solidity smart contracts
│   ├── StakingProtocol.sol       # Core staking logic
│   ├── StakingToken.sol          # STK ERC-20 token
│   └── RewardToken.sol           # RWD ERC-20 token
├── deploy/
│   └── 00_deploy_staking.ts      # hardhat-deploy deployment script
├── scripts/
│   └── deploy.ts                 # Alternative deploy script (hardhat run)
├── frontend/                     # Next.js frontend application
│   ├── app/                      # Next.js App Router pages
│   ├── components/               # React components
│   ├── hooks/                    # Custom React hooks (useStaking)
│   ├── lib/                      # Utilities, providers, ABIs
│   └── providers/                # React Query provider
├── artifacts/                    # Compiled contract artifacts (auto-generated)
├── deployments/                  # hardhat-deploy deployment records
├── typechain-types/              # TypeScript contract bindings (auto-generated)
├── docker-compose.yml            # Multi-container Docker setup
├── Dockerfile.hardhat            # Hardhat node + deploy container
├── docker-entrypoint.sh          # Hardhat container startup script
├── hardhat.config.ts             # Hardhat configuration
├── package.json                  # Root dependencies
└── tsconfig.json                 # TypeScript configuration
```

---

## Contract API Reference

### Owner Functions

| Function     | Parameters                              | Description                              |
| ------------ | --------------------------------------- | ---------------------------------------- |
| `createPool` | `apyRate`, `lockDuration`, `isFlexible` | Create a new staking pool                |
| `pause`      | —                                       | Pause all stake/unstake/claim operations |
| `unpause`    | —                                       | Resume operations                        |

### User Functions

| Function            | Parameters         | Description                                                       |
| ------------------- | ------------------ | ----------------------------------------------------------------- |
| `stake`             | `poolId`, `amount` | Stake STK tokens into a pool (requires prior ERC-20 approval)     |
| `claimRewards`      | `positionId`       | Claim accrued RWD rewards                                         |
| `unstake`           | `positionId`       | Withdraw principal + rewards (must be unlocked or flexible)       |
| `withdrawEarly`     | `positionId`       | Exit locked pool early with 10% penalty, no rewards               |
| `emergencyWithdraw` | `positionId`       | Withdraw principal only, forfeit rewards (works even when paused) |

### View Functions

| Function                        | Returns     | Description                                     |
| ------------------------------- | ----------- | ----------------------------------------------- |
| `poolCount()`                   | `uint256`   | Number of pools                                 |
| `getPoolInfo(poolId)`           | `Pool`      | Pool details (APY, lock duration, total staked) |
| `getUserPositions(address)`     | `uint256[]` | Array of position IDs for a user                |
| `positions(positionId)`         | `Position`  | Position details (amount, pool, timestamps)     |
| `getPendingRewards(positionId)` | `uint256`   | Unclaimed reward amount                         |
| `totalValueLocked()`            | `uint256`   | Total STK staked across all pools               |

---

## Security

### Built-in Protections

- **ReentrancyGuard** — All state-changing functions are non-reentrant
- **Pausable** — Owner can halt operations in case of emergency
- **Checks-Effects-Interactions** — State is updated before external calls
- **Immutable tokens** — `stakingToken` and `rewardToken` addresses cannot be changed after deployment

### Safety Recommendations

1. Never commit `.env` files with private keys — add to `.gitignore`
2. Test thoroughly on a local network before any testnet/mainnet deployment
3. Verify contracts on block explorers (Etherscan) after deployment
4. Use hardware wallets for mainnet deployments
5. Ensure the protocol contract is funded with sufficient RWD tokens before users start staking

---

## Troubleshooting

| Problem                                              | Solution                                                                                       |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Pools not loading in frontend                        | Ensure Hardhat node is running at `localhost:8545` and contracts are deployed                  |
| "MetaMask not found"                                 | Install MetaMask extension and refresh the page                                                |
| Transaction fails with "Insufficient reward balance" | The protocol contract needs more RWD tokens — owner must transfer more                         |
| Stale data after staking/unstaking                   | Should auto-refresh; if not, hard-refresh the page                                             |
| Wrong contract addresses                             | Check `frontend/.env` matches the deploy output; restart the dev server after changes          |
| Docker frontend can't connect                        | Ensure `hardhat-node` container is healthy before frontend starts; check `docker-compose logs` |
| `npx hardhat deploy` fails                           | Run `npx hardhat compile` first; ensure `deploy/` directory has the script                     |

---

## Tech Stack

| Layer                  | Technology                         |
| ---------------------- | ---------------------------------- |
| Smart Contracts        | Solidity 0.8.28, OpenZeppelin v5   |
| Development Framework  | Hardhat, hardhat-deploy, TypeChain |
| Frontend               | Next.js 16, React 19, TypeScript   |
| Blockchain Interaction | ethers.js v6                       |
| State Management       | TanStack React Query v5            |
| Styling                | Tailwind CSS v4                    |
| Containerization       | Docker, Docker Compose             |

---

## License

MIT
