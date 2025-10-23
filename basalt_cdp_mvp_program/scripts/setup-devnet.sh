#!/bin/bash

# Solana Devnet Setup Script
# Based on Alchemy's Solana Devnet guide: https://www.alchemy.com/overviews/solana-devnet

set -e

echo "🚀 Setting up Solana Devnet environment..."

# 1. Configure Solana CLI to use devnet
echo "📡 Configuring Solana CLI for devnet..."
solana config set --url https://api.devnet.solana.com

# 2. Set the wallet keypair
echo "🔑 Setting wallet keypair..."
solana config set --keypair /Users/user2/.config/solana/basalt.json

# 3. Check current configuration
echo "⚙️  Current Solana configuration:"
solana config get

# 4. Check current balance
echo "💰 Checking current SOL balance..."
BALANCE=$(solana balance 2>/dev/null || echo "0")
echo "Current balance: $BALANCE"

# 5. Request devnet SOL if balance is low
BALANCE_NUM=$(echo $BALANCE | cut -d' ' -f1)
if (( $(echo "$BALANCE_NUM < 1" | bc -l) )); then
    echo "💸 Balance is low, requesting devnet SOL airdrop..."
    solana airdrop 2 --url https://api.devnet.solana.com
    echo "✅ Airdrop completed!"
else
    echo "✅ Balance is sufficient for testing"
fi

# 6. Verify final balance
echo "💰 Final balance:"
solana balance

# 7. Show devnet explorer link
PUBKEY=$(solana-keygen pubkey /Users/user2/.config/solana/basalt.json)
echo "🔍 View your account on Solana Devnet Explorer:"
echo "https://explorer.solana.com/address/$PUBKEY?cluster=devnet"

echo "✨ Devnet setup complete! You're ready to deploy and test on Solana devnet."