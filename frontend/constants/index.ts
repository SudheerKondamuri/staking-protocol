// Replace this with the address printed in your terminal when you ran `npx hardhat deploy`
// It usually looks like 0x5FbDB2315678afecb367f032d93F642f64180aa3
export const STAKING_CONTRACT_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"; 
export const STAKING_TOKEN_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export const STAKING_ABI = [
  // Paste the full ABI array from artifacts/contracts/StakingProtocol.sol/StakingProtocol.json here
  // Below is a minimal example to get the dashboard working:
  {
    "inputs": [],
    "name": "totalStaked",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "name": "pools",
    "outputs": [
      { "internalType": "uint256", "name": "apyRate", "type": "uint256" },
      { "internalType": "uint256", "name": "lockDuration", "type": "uint256" },
      { "internalType": "bool", "name": "isFlexible", "type": "bool" },
      { "internalType": "uint256", "name": "totalStaked", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_poolId", "type": "uint256" },
      { "internalType": "uint256", "name": "_amount", "type": "uint256" }
    ],
    "name": "stake",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;