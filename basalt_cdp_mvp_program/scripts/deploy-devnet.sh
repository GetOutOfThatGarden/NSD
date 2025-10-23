#!/bin/bash

# Solana Devnet Deployment Script
# Follows Alchemy's best practices for devnet deployment

set -e

echo "🚀 Deploying Basalt CDP MVP to Solana Devnet..."

# 1. Ensure we're on devnet
echo "📡 Verifying devnet configuration..."
CURRENT_URL=$(solana config get | grep "RPC URL" | awk '{print $3}')
if [[ "$CURRENT_URL" != "https://api.devnet.solana.com" ]]; then
    echo "⚠️  Not connected to devnet. Switching..."
    solana config set --url https://api.devnet.solana.com
fi

# 2. Check balance before deployment
echo "💰 Checking SOL balance..."
BALANCE=$(solana balance | cut -d' ' -f1)
if (( $(echo "$BALANCE < 5" | bc -l) )); then
    echo "💸 Insufficient balance for deployment. Requesting airdrop..."
    solana airdrop 5 --url https://api.devnet.solana.com
    sleep 5
fi

# 3. Build the program
echo "🔨 Building Anchor program..."
anchor build

# 4. Deploy to devnet
echo "🚀 Deploying to devnet..."
anchor deploy --provider.cluster devnet

# 5. Get the deployed program ID
PROGRAM_ID=$(solana address -k target/deploy/basalt_cdp_mvp-keypair.json)
echo "📋 Program deployed with ID: $PROGRAM_ID"

# 6. Verify deployment
echo "🔍 Verifying deployment..."
solana program show $PROGRAM_ID --url https://api.devnet.solana.com

# 7. Update the program ID in configuration files
echo "📝 Updating program ID in configuration..."
sed -i.bak "s/BasaltCdpMvp11111111111111111111111111111111111/$PROGRAM_ID/g" app/solana/config.ts

# 8. Show explorer links
echo "🔍 View your program on Solana Devnet Explorer:"
echo "https://explorer.solana.com/address/$PROGRAM_ID?cluster=devnet"

# 9. Show next steps
echo "✨ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Run tests: anchor test --provider.cluster devnet --skip-local-validator"
echo "2. Initialize protocol: Use the frontend or run initialization script"
echo "3. Test CDP operations: mint, redeem, liquidate"
echo ""
echo "💡 Remember: This is devnet - use test SOL only!"