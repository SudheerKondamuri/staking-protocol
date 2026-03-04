#!/bin/bash
set -e

# Clear previous ready state if restarting
rm -f /shared/hardhat_ready

echo "Starting Hardhat node in the background..."
npx hardhat node --hostname 0.0.0.0 --port 8545 &
NODE_PID=$!

echo "Waiting for Hardhat node to start..."
while ! curl -s http://127.0.0.1:8545 > /dev/null 2>&1; do
  sleep 1
done

echo "Hardhat node is up! Deploying contracts..."

# Clean old deployments for a fresh start
rm -rf /app/deployments/localhost || true

# Use hardhat deploy (uses deploy/00_deploy_staking.ts which works correctly)
npx hardhat deploy --network localhost

echo "Extracting deployed contract addresses..."
# Read addresses from hardhat-deploy artifacts
STAKING_PROTOCOL=$(node -e "console.log(JSON.parse(require('fs').readFileSync('/app/deployments/localhost/StakingProtocol.json','utf8')).address)")
STAKING_TOKEN=$(node -e "console.log(JSON.parse(require('fs').readFileSync('/app/deployments/localhost/StakingToken.json','utf8')).address)")

echo "  StakingProtocol: $STAKING_PROTOCOL"
echo "  StakingToken:    $STAKING_TOKEN"

# Write .env for frontend to shared volume
cat > /shared/.env <<EOF
NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS=$STAKING_PROTOCOL
NEXT_PUBLIC_STAKING_TOKEN_ADDRESS=$STAKING_TOKEN
NEXT_PUBLIC_RPC_URL=http://localhost:8545
EOF

echo ".env written to shared volume:"
cat /shared/.env

# Share the ABIs for the frontend
mkdir -p /shared/abi
cp /app/artifacts/contracts/StakingProtocol.sol/StakingProtocol.json /shared/abi/ 2>/dev/null || true
cp /app/artifacts/contracts/StakingToken.sol/StakingToken.json /shared/abi/ 2>/dev/null || true

# Signal that deployment is complete
touch /shared/hardhat_ready

echo "Hardhat node is running and setup is complete."
wait $NODE_PID
