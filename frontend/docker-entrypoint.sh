#!/bin/bash
set -e

echo "Waiting for hardhat deployment to finish..."
while [ ! -f /shared/hardhat_ready ]; do
  sleep 1
done

echo "Loading .env from shared directory..."
if [ -f "/shared/.env" ]; then
    cp /shared/.env /app/.env
    echo "Sourcing environment variables into process:"
    cat /app/.env
    
    # Force inject variables
    set -a
    source /app/.env
    set +a
fi

# Sync ABIs 
if [ -d "/shared/abi" ]; then
    mkdir -p /app/lib/abi
    cp -r /shared/abi/* /app/lib/abi/ || true
    echo "ABIs synced mapping from Hardhat"
fi

echo "Clearing Next.js cache to avoid stale environment variables..."
rm -rf /app/.next/cache || true

echo "Starting Next.js Dev Server..."
npm run dev -- --hostname 0.0.0.0 --port 3000
