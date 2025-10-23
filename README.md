# BASALT CDP Protocol MVP

🚀 **Status**: Security-audited and ready for devnet deployment  
🔒 **Security**: Comprehensive security audit completed  
🌐 **Network**: Configured for Solana Devnet  

## Project Overview and Purpose

The BASALT CDP (Collateralized Debt Position) Protocol MVP is a decentralized finance (DeFi) application built on the Solana blockchain that enables users to borrow synthetic assets against collateral. This implementation focuses on creating a secure, efficient, and scalable CDP system with core functionalities including minting, redeeming, and liquidating positions.

The protocol operates by allowing users to deposit collateral (e.g., SOL) into a vault and borrow synthetic assets (e.g., USD_RW). The system maintains a healthy collateral ratio to ensure the stability of the protocol and protect against insolvency.

## Key Features and Functionality

### Core CDP Loop

1. **Mint (Borrow)**: Users deposit collateral and mint synthetic assets (USD_RW) up to a certain collateral ratio threshold.
2. **Redeem (Repay)**: Users can repay their debt by redeeming collateral from their vault.
3. **Liquidate**: When a vault's collateral ratio falls below the required threshold, it can be liquidated by other users to recover the debt.

### Protocol Architecture

The protocol implements a robust architecture with:
- **Protocol Configuration**: Centralized settings and constants
- **User Vaults**: Individual user positions with collateral and debt tracking
- **Fixed-Point Arithmetic**: Precise financial calculations using 64.64 fixed-point representation
- **Interest Calculation**: Automated interest accrual based on time and debt levels

## Technical Architecture

### Account Structures

#### ProtocolConfig
```rust
#[account]
pub struct ProtocolConfig {
    pub owner: Pubkey,
    pub collateral_mint: Pubkey,
    pub usdrw_mint: Pubkey,
    pub collateral_ratio: u64, // Fixed-point 64.64
    pub interest_rate: u64,    // Fixed-point 64.64
    pub liquidation_threshold: u64, // Fixed-point 64.64
    pub last_interest_update: i64,
}
```

#### UserVault
```rust
#[account]
pub struct UserVault {
    pub owner: Pubkey,
    pub protocol_config: Pubkey,
    pub collateral_amount: u64, // Fixed-point 64.64
    pub debt_amount: u64,       // Fixed-point 64.64
    pub last_interest_update: i64,
    pub bump: u8,
}
```

### Financial Constants and Fixed-Point Arithmetic

The protocol uses 64.64 fixed-point arithmetic for precise financial calculations:

- **Collateral Ratio**: Minimum required collateral-to-debt ratio (e.g., 150%)
- **Interest Rate**: Annual interest rate applied to debt (e.g., 5%)
- **Liquidation Threshold**: Ratio at which vaults become eligible for liquidation (e.g., 120%)

Fixed-point operations are implemented using the `fixed` crate for precise calculations without floating-point errors.

## Program Instructions and Workflows

### 1. Mint USD_RW (Borrow)
```rust
pub fn mint_usdrw(ctx: Context<MintUsdrw>, amount: u64) -> Result<()> {
    // Validate user has sufficient collateral
    // Calculate mintable amount based on collateral ratio
    // Update vault debt and user's USD_RW balance
    // Apply interest if needed
}
```

### 2. Redeem Collateral (Repay)
```rust
pub fn redeem_collateral(ctx: Context<RedeemCollateral>, amount: u64) -> Result<()> {
    // Validate user has sufficient debt to redeem
    // Update vault debt and collateral amounts
    // Transfer collateral back to user
    // Apply interest if needed
}
```

### 3. Liquidate Vault
```rust
pub fn liquidate_vault(ctx: Context<LiquidateVault>, vault: Pubkey) -> Result<()> {
    // Validate vault is undercollateralized
    // Calculate liquidation amount
    // Transfer collateral to liquidator
    // Reduce vault debt
}
```

### 4. Calculate Interest
```rust
pub fn calculate_interest(ctx: Context<CalculateInterest>) -> Result<()> {
    // Calculate interest based on time elapsed
    // Update vault debt with accrued interest
    // Update last interest update timestamp
}
```

## Setup and Deployment Instructions

### Prerequisites
- Rust 1.70+
- Node.js 18+
- Anchor CLI
- Solana CLI

### Installation Steps

1. Clone the repository:
```bash
git clone <repository-url>
cd basalt_cdp_mvp_program
```

2. Install dependencies:
```bash
npm install
cargo install anchor-cli
```

3. Build the program:
```bash
anchor build
```

4. Deploy to localnet:
```bash
anchor deploy
```

5. Run tests:
```bash
anchor test
```

### Environment Configuration

Create a `.env` file with:
```env
ANCHOR_WALLET=~/.config/solana/id.json
```

### Devnet Deployment

The project is configured for Solana Devnet deployment:

1. **Deploy to Devnet**:
```bash
./scripts/deploy-devnet.sh
```

2. **Setup Devnet Environment**:
```bash
./scripts/setup-devnet.sh
```

3. **Verify Deployment**:
```bash
solana program show <PROGRAM_ID> --url devnet
```

**Important**: This is a devnet deployment for testing purposes only. Use test SOL from the devnet faucet.

**Note**: The README.md file is not uploaded to the Solana blockchain during deployment. Only the compiled program bytecode is deployed to devnet. This documentation remains in the repository for development reference.

## User Workflow

### Borrowing Process
1. User deposits collateral into the protocol
2. User calls `mint_usdrw` to borrow USD_RW
3. Protocol validates collateral ratio and mints appropriate amount
4. User receives USD_RW tokens in their wallet

### Repayment Process
1. User calls `redeem_collateral` to repay debt
2. Protocol calculates how much collateral can be redeemed
3. Collateral is transferred back to user
4. Debt is reduced accordingly

### Liquidation Process
1. Vault becomes undercollateralized
2. Any user can call `liquidate_vault`
3. Protocol calculates liquidation amount
4. Liquidator receives collateral at a discount
5. Vault debt is reduced

## Security Audit and Considerations

### Security Audit Status ✅
The protocol has undergone a comprehensive security audit covering:

- **Program Code Security**: All instructions validated for proper access controls
- **Configuration Security**: No hardcoded secrets or sensitive data exposed
- **Wallet Security**: Test wallet files removed, `.gitignore` updated
- **Access Control Validation**: User permissions and vault ownership verified
- **Deployment Scripts**: Clean and secure deployment configuration

### Security Measures
- **Account Validation**: All accounts are validated before processing
- **Collateral Ratio Checks**: Ensures sufficient collateral at all times
- **Interest Calculation**: Accurate time-based interest accrual
- **Reentrancy Protection**: Prevents malicious reentrancy attacks
- **Input Validation**: All parameters are strictly validated
- **Vault Ownership**: Strict validation of vault ownership in all operations
- **Liquidation Logic**: Secure undercollateralization checks

### Best Practices
- **Use Fixed-Point Arithmetic**: Prevents floating-point precision errors
- **Implement Proper Error Handling**: Clear error messages for debugging
- **Validate All Accounts**: Ensure account ownership and permissions
- **Test Edge Cases**: Include tests for boundary conditions
- **Monitor Gas Costs**: Optimize instruction efficiency
- **Secure Development**: No sensitive files in version control

## Directory Structure and Codebase Organization

```
basalt_cdp_mvp_program/
├── programs/
│   └── basalt_cdp_mvp/
│       ├── src/
│       │   ├── instructions/
│       │   │   ├── calculate_interest.rs
│       │   │   ├── initialize_protocol.rs
│       │   │   ├── liquidate_vault.rs
│       │   │   ├── mint_usdrw.rs
│       │   │   └── redeem_collateral.rs
│       │   ├── state/
│       │   │   ├── protocol_config.rs
│       │   │   └── user_vault.rs
│       │   ├── constants.rs
│       │   ├── error.rs
│       │   └── lib.rs
│       ├── Cargo.toml
│       └── Xargo.toml
├── app/
│   ├── solana/
│   │   ├── client/
│   │   │   ├── rpc.ts
│   │   │   └── pda.ts
│   │   ├── useProgram.ts
│   │   └── SolanaProvider.tsx
│   ├── components/
│   │   └── Header.tsx
│   ├── routes/
│   │   ├── home.tsx
│   │   └── docs.tsx
│   └── root.tsx
├── tests/
│   └── basalt_cdp_mvp.ts
├── migrations/
│   └── deploy.ts
├── Anchor.toml
├── Cargo.toml
├── package.json
└── README.md
```

### Key Components

1. **Program Instructions**: Core business logic in `src/instructions/`
2. **State Management**: Account structures in `src/state/`
3. **Constants**: Financial constants in `src/constants.rs`
4. **Error Handling**: Custom errors in `src/error.rs`
5. **Frontend Integration**: Solana client in `app/solana/`
6. **User Interface**: React components in `app/components/`
7. **Testing**: Integration tests in `tests/`