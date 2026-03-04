#!/bin/bash
set -e

echo "Waiting for hardhat deployment to finish..."
while [ ! -f /shared/hardhat_ready ]; do
  sleep 1
done

echo "Loading .env from shared directory..."
if [ -f "/shared/.env" ]; then
    # Copy to Next.js project root so next dev picks it up natively
    cp /shared/.env /app/.env.local
    echo "Environment variables:"
    cat /app/.env.local

    # Also export into current shell for good measure
    set -a
    source /app/.env.local
    set +a
else
    echo "ERROR: /shared/.env not found! Frontend will not work."
    exit 1
fi

# Sync ABIs from hardhat build
if [ -d "/shared/abi" ]; then
    mkdir -p /app/lib/abi
    cp -r /shared/abi/* /app/lib/abi/ || true
    echo "ABIs synced from Hardhat build."
fi

echo "Clearing Next.js cache to avoid stale builds..."
rm -rf /app/.next || true

echo "Starting Next.js Dev Server..."
exec npm run build
