#!/bin/bash
# Exit immediately if a command exits with a non-zero status
set -e

# Source the Rust/Cargo environment if available
if [ -f "$HOME/.cargo/env" ]; then
    source "$HOME/.cargo/env"
fi

echo "Step 1: Building Soroban contract..."
cd contract
stellar contract build
cd ..

# Verify if a source account was passed
if [ -z "$1" ]; then
    echo "Error: Source account/identity is required."
    echo "Usage: ./deploy.sh <source_account_or_identity> [network (default: testnet)]"
    exit 1
fi

SOURCE=$1
NETWORK=${2:-testnet}

echo "Step 2: Deploying contract to $NETWORK using source: $SOURCE..."
stellar contract deploy \
  --wasm contract/target/wasm32v1-none/release/contract.wasm \
  --source-account "$SOURCE" \
  --network "$NETWORK"
