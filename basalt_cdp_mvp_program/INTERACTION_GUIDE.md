# 🚀 Basalt CDP Program Interaction Guide

This guide shows you **exactly how to interact** with your deployed Solana program on localnet.

## 📋 Program Information
- **Program ID**: `8S5e9SrQyDgWvtXaaEpKLyoC46QEqBuDP9xjdx8K5az3`
- **Network**: Localnet (http://127.0.0.1:8899)
- **Status**: ✅ Deployed and Running

---

## 🛠️ Method 1: Solana CLI (Easiest)

### Basic Commands
```bash
# Check program info
solana program show 8S5e9SrQyDgWvtXaaEpKLyoC46QEqBuDP9xjdx8K5az3

# Check your balance
solana balance

# Check current network activity
solana slot

# Monitor program logs (real-time)
solana logs 8S5e9SrQyDgWvtXaaEpKLyoC46QEqBuDP9xjdx8K5az3
```

### Account Management
```bash
# Create a test wallet
solana-keygen new --outfile test-wallet.json --no-bip39-passphrase

# Airdrop SOL to test wallet
solana airdrop 5 <WALLET_ADDRESS>

# Check account details
solana account <ACCOUNT_ADDRESS>
```

---

## 💻 Method 2: TypeScript/JavaScript

### Simple Interaction Script
We created `simple-interaction.ts` that shows you how to:
- Connect to your localnet
- Load your wallet
- Check balances
- Interact with the program
- Create test accounts

**Run it:**
```bash
npx ts-node simple-interaction.ts
```

### What the script does:
1. ✅ Connects to localnet
2. 👛 Loads your wallet
3. 💰 Checks your balance
4. 📋 Gets program information
5. 🔄 Shows current network slot
6. 🧪 Creates a test account
7. 💸 Airdrops SOL to test account

---

## 🎯 Method 3: Program Function Calls

Your program has these functions:
1. `initialize_protocol` - Set up the CDP protocol
2. `mint_usdrw` - Mint USDRW tokens against collateral
3. `redeem_collateral` - Redeem collateral by burning USDRW
4. `liquidate_vault` - Liquidate undercollateralized vaults
5. `calculate_interest` - Calculate interest on positions

### Using Anchor (when IDL works):
```typescript
// Example of calling initialize_protocol
await program.methods
  .initializeProtocol()
  .accounts({
    // Add required accounts
  })
  .rpc();
```

---

## 📊 Method 4: Real-time Monitoring

### Monitor Program Activity
```bash
# In one terminal - keep this running
solana logs 8S5e9SrQyDgWvtXaaEpKLyoC46QEqBuDP9xjdx8K5az3

# In another terminal - run your interactions
npx ts-node simple-interaction.ts
```

### Watch Network Activity
```bash
# Check if localnet is progressing
watch -n 1 'solana slot'

# Monitor all transactions
solana logs
```

---

## 🧪 Testing Scenarios

### Scenario 1: Basic Connectivity Test
```bash
# 1. Check if localnet is running
solana slot

# 2. Check your balance
solana balance

# 3. Check program status
solana program show 8S5e9SrQyDgWvtXaaEpKLyoC46QEqBuDP9xjdx8K5az3
```

### Scenario 2: Account Creation Test
```bash
# 1. Create test account
solana-keygen new --outfile test-account.json --no-bip39-passphrase

# 2. Get the public key
solana-keygen pubkey test-account.json

# 3. Airdrop SOL
solana airdrop 2 $(solana-keygen pubkey test-account.json)

# 4. Check balance
solana balance $(solana-keygen pubkey test-account.json)
```

### Scenario 3: Program Interaction Test
```bash
# Run the TypeScript interaction script
npx ts-node simple-interaction.ts
```

---

## 🔧 Troubleshooting

### Common Issues:

1. **"Connection refused"**
   - Make sure localnet is running: `solana-test-validator --reset`

2. **"Insufficient funds"**
   - Airdrop more SOL: `solana airdrop 5`

3. **"Program not found"**
   - Redeploy: `solana program deploy target/deploy/basalt_cdp_mvp.so`

4. **IDL compilation errors**
   - Use direct CLI commands instead of Anchor tests

---

## 📈 Next Steps

1. **✅ You've successfully deployed and verified your program**
2. **✅ You can interact with it using CLI and TypeScript**
3. **🎯 Next: Try calling specific program functions**
4. **🚀 Next: Deploy to devnet when ready**

---

## 🎉 Success Indicators

If you see these, everything is working:
- ✅ `solana slot` returns increasing numbers
- ✅ `solana balance` shows your SOL
- ✅ `simple-interaction.ts` runs without errors
- ✅ Program logs show activity when monitoring

**Your program is ready for interaction!** 🚀