# Basalt CDP MVP - Devnet Deployment Guide

## Pre-Deployment Checklist ✅

All security and configuration checks have been completed:

- [x] **Security Audit**: No sensitive information found in codebase
- [x] **Configuration**: Hardcoded paths removed and made portable
- [x] **Build Verification**: Program compiles successfully
- [x] **Program ID**: Updated in frontend configuration files
- [x] **SOL Balance**: Current balance: 1.9 SOL (sufficient for deployment)

## Current Configuration

### Program Information
- **Program ID**: `8S5e9SrQyDgWvtXaaEpKLyoC46QEqBuDP9xjdx8K5az3`
- **Network**: Solana Devnet
- **Wallet**: Uses `~/.config/solana/id.json` (or `$SOLANA_WALLET` if set)

### Updated Files
- `Anchor.toml`: Wallet path made portable
- `setup-devnet.sh`: Environment variable support added
- `app/solana/config.ts`: Program ID updated for all environments
- `app/solana/client/index.ts`: Program ID updated

## Deployment Steps

### 1. Environment Setup
```bash
# Ensure you're on devnet
solana config set --url devnet

# Set your wallet (optional, defaults to ~/.config/solana/id.json)
export SOLANA_WALLET=~/.config/solana/id.json

# Run setup script
./setup-devnet.sh
```

### 2. Deploy Program
```bash
# Deploy to devnet
./deploy-devnet.sh
```

### 3. Verify Deployment
After deployment, verify using:
- **Solana Explorer**: https://explorer.solana.com/address/8S5e9SrQyDgWvtXaaEpKLyoC46QEqBuDP9xjdx8K5az3?cluster=devnet
- **SolanaFM**: https://solana.fm/address/8S5e9SrQyDgWvtXaaEpKLyoC46QEqBuDP9xjdx8K5az3?cluster=devnet-alpha

## Post-Deployment Tasks

### 1. Initialize Protocol
After deployment, you'll need to initialize the protocol with:
- Collateral mint address
- USD_RW mint address
- Protocol parameters (interest rate, liquidation threshold, etc.)

### 2. Frontend Integration
The frontend is already configured with the correct program ID. Ensure:
- Dependencies are installed: `npm install`
- Environment variables are set for the desired cluster
- Test the connection to the deployed program

### 3. Testing
Run integration tests against the deployed program:
```bash
# Test against devnet deployment
anchor test --provider.cluster devnet
```

## Known Issues & Limitations

### Build Warnings
The following warnings are present but don't affect functionality:
- Unused imports in various files
- Unexpected `cfg` condition values for `anchor-debug`
- IDL build compatibility issues (resolved by using `--no-idl` flag)

### SOL Balance
Current balance (1.9 SOL) is sufficient for deployment but may be low for extensive testing. Consider requesting additional devnet SOL if needed:
```bash
solana airdrop 2
```

## Security Notes

✅ **Security Audit Completed**
- No private keys or sensitive data found in repository
- No hardcoded personal information in configuration
- All paths made portable and environment-friendly
- Program keypair is properly generated and not sensitive user data

## Explorer Links

Once deployed, monitor your program at:
- **Program Account**: https://explorer.solana.com/address/8S5e9SrQyDgWvtXaaEpKLyoC46QEqBuDP9xjdx8K5az3?cluster=devnet
- **Transactions**: Filter by program ID to see all interactions

## Troubleshooting

### Common Issues
1. **Insufficient SOL**: Request airdrop with `solana airdrop 2`
2. **Wrong Network**: Verify with `solana config get`
3. **Build Failures**: Use `anchor build --no-idl` to bypass IDL issues
4. **Wallet Issues**: Ensure wallet exists and has proper permissions

### Support
- Check Anchor documentation for deployment issues
- Verify Solana CLI configuration
- Ensure all dependencies are properly installed

---

**Ready for Devnet Deployment** 🚀

All pre-deployment checks have been completed successfully. The program is ready to be deployed to Solana Devnet.