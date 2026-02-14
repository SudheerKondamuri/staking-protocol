# Staking Protocol Deployment Guide

This directory contains scripts for deploying the Staking Protocol contracts to various networks.

## Prerequisites

1. **Environment Setup**
   - Node.js >= 18.x installed
   - All dependencies installed: `npm install`
   - Hardhat configured in `hardhat.config.ts`

2. **Network Configuration**
   - Configure your network in `hardhat.config.ts` or use environment variables
   - Ensure you have sufficient balance for deployment gas fees

## Files

- **`deploy.ts`** - Main deployment script that deploys all contracts and creates initial staking pools
- **`verify.ts`** - Verification script to confirm successful deployment
- **`addresses.json`** - Auto-generated file containing deployed contract addresses

## Deployment Steps

### 1. Deploy to Hardhat Local Network (for testing)

```bash
npx hardhat run deploy/deploy.ts --network hardhat
```

### 2. Deploy to a Testnet or Mainnet

First, update your `hardhat.config.ts` with network configuration:

```typescript
networks: {
  sepolia: {
    url: process.env.SEPOLIA_RPC_URL,
    accounts: [process.env.PRIVATE_KEY]
  }
}
```

Then deploy:

```bash
npx hardhat run deploy/deploy.ts --network sepolia
```

### 3. Verify Deployment

After successful deployment, verify the contracts:

```bash
npx hardhat run deploy/verify.ts --network sepolia
```

## What Gets Deployed

### Contracts Deployed:
1. **StakingToken (STK)** - ERC20 token used for staking
2. **RewardToken (RWD)** - ERC20 token used for rewards
3. **StakingProtocol** - Main protocol managing staking pools

### Initial Pools Created:
- **Pool 0**: Fixed Pool - 10% APY, 30-day lock period
- **Pool 1**: Flexible Pool - 5% APY, no lock period

## Key Functions (After Deployment)

### StakingProtocol Actions:

```solidity
// Create a new staking pool
createPool(apy, lockDuration, isFlexible)

// Stake tokens in a pool
stake(poolId, amount)

// Claim earned rewards
claimRewards(positionId)

// Unstake tokens (after lock period if fixed)
unstake(positionId)

// Withdraw early with penalty (fixed pools only)
withdrawEarly(positionId)
```

## Deployment Output

After successful deployment, you'll see:
- Contract addresses logged to console
- `addresses.json` file created with all deployment info
- Confirmation of initial pool creation

Example `addresses.json`:
```json
{
  "stakingToken": "0x...",
  "rewardToken": "0x...",
  "stakingProtocol": "0x...",
  "deployer": "0x...",
  "deploymentTime": "2026-02-13T...",
  "network": "sepolia"
}
```

## Testing

Before mainnet deployment, test locally:

```bash
# Compile contracts
npx hardhat compile

# Run tests (if tests are available)
npx hardhat test

# Deploy to local network and verify
npx hardhat run deploy/deploy.ts --network hardhat
npx hardhat run deploy/verify.ts --network hardhat
```

## Troubleshooting

### Insufficient Funds
- Check your account balance: Should be > deployment gas costs
- On testnet, use a faucet to get test tokens

### Contract Not Found
- Ensure contracts are in `/contracts/` directory
- Run `npx hardhat compile` first

### Network Connection Issues
- Verify RPC URL is correct
- Check your network configuration in `hardhat.config.ts`

## Environment Variables (Optional)

Create a `.env` file:
```
PRIVATE_KEY=your_private_key_here
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
```

## Safety Recommendations

1. **Never commit `.env` files** - Add to `.gitignore`
2. **Test on testnet first** - Before mainnet deployment
3. **Verify contracts** - Use block explorers like Etherscan
4. **Backup addresses.json** - Store deployment addresses safely
5. **Use hardware wallets** - For mainnet deployments

## Gas Estimation

Expected gas costs (approximate):
- StakingToken deployment: ~100,000 gas
- RewardToken deployment: ~100,000 gas
- StakingProtocol deployment: ~250,000 gas
- Pool creation (2 pools): ~60,000 gas
- **Total: ~510,000 gas**

Adjust based on current network conditions and token prices.

## Support

For more information:
- [Hardhat Documentation](https://hardhat.org/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Solidity Documentation](https://docs.soliditylang.org/)
