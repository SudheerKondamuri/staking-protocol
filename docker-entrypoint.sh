#!/bin/bash
set -e

# Clear previous ready state if restarting
rm -f /shared/hardhat_ready

echo "Starting Hardhat node in the background..."
npx hardhat node --hostname 0.0.0.0 --port 8545 &
NODE_PID=$!

echo "Waiting for Hardhat node to start..."
while ! curl -s http://127.0.0.1:8545 > /dev/null; do
  sleep 1
done

echo "Hardhat node is up! Deploying contracts..."
# Make sure frontend directory exists for the script
mkdir -p /app/frontend

# Copy example env in case it's needed
cp -n frontend/.env.example frontend/.env || true

# Deploy contracts locally
echo "Clearing old deployment records..."
rm -rf /app/deployments/localhost || true
npx hardhat run scripts/deploy.ts --network localhost

echo "Extracting frontend environment variables..."
if [ -f "/app/frontend/.env" ]; then
    cp /app/frontend/.env /shared/.env
    echo ".env copied to shared volume:"
    cat /shared/.env
else
    echo "WARNING: /app/frontend/.env not found."
fi

# Share the ABIs for the frontend
mkdir -p /shared/abi
cp -r /app/artifacts/contracts/StakingProtocol.sol/StakingProtocol.json /shared/abi/ 2>/dev/null || true
cp -r /app/artifacts/contracts/StakingToken.sol/StakingToken.json /shared/abi/ 2>/dev/null || true

# Signal that deployment is complete
touch /shared/hardhat_ready

echo "Hardhat node is running and setup is complete."
wait $NODE_PID
