# Basalt CDP MVP - Minting Process Technical Specification

## Table of Contents
1. [Program Architecture Overview](#program-architecture-overview)
2. [Detailed Minting Sequence](#detailed-minting-sequence)
3. [Security Considerations](#security-considerations)
4. [Technical Specifications](#technical-specifications)
5. [Testing Requirements](#testing-requirements)

## Program Architecture Overview

### Smart Contract Structure and Entry Points

The Basalt CDP MVP is a Solana program implementing a Collateralized Debt Position (CDP) protocol that allows users to mint USD_RW tokens by depositing collateral. The program is structured as follows:

**Main Program Entry Points:**
- `initialize_protocol` - Sets up the global protocol configuration
- `initialize_collateral_vault` - Creates the protocol's collateral token account
- `mint_usdrw` - Primary minting function for USD_RW tokens
- `redeem_collateral` - Allows users to repay debt and withdraw collateral
- `liquidate_vault` - Liquidates undercollateralized positions (supports self-liquidation)
- `calculate_interest` - Updates interest calculations for vaults

**Program Structure:**
```
programs/basalt_cdp_mvp/src/
├── lib.rs                    # Main program entry point
├── instructions/             # Instruction handlers
│   ├── initialize_protocol.rs
│   ├── initialize_collateral_vault.rs
│   ├── mint_usdrw.rs        # Core minting logic
│   ├── redeem_collateral.rs
│   ├── liquidate_vault.rs
│   └── calculate_interest.rs
├── state/                   # Account state definitions
│   ├── protocol_config.rs   # Global protocol configuration
│   └── user_vault.rs        # Individual user vault state
├── constants.rs             # Protocol constants and parameters
└── error.rs                 # Custom error definitions
```

### Account Relationships and Required Signers

**Core Account Types:**

1. **ProtocolConfig (PDA)** - Global protocol configuration
   - Seeds: `["protocol_config"]`
   - Authority: Protocol owner
   - Contains: collateral mint, USD_RW mint, ratios, interest rates

2. **UserVault (PDA)** - Individual user position
   - Seeds: `["user_vault", user_pubkey, protocol_config]`
   - Authority: User
   - Contains: collateral amount, debt amount, interest tracking

3. **Protocol Collateral Vault (PDA)** - Protocol's collateral token account
   - Seeds: `["collateral_vault", protocol_config]`
   - Authority: ProtocolConfig PDA
   - Token Account: Holds all deposited collateral

**Required Signers for Minting:**
- User (vault owner)
- No additional signers required (uses PDAs for authority)

### Token Metadata Handling

The program handles two types of tokens:

1. **Collateral Token (SPYx)** - External token used as collateral
   
   **Token Specification:**
   - **Primary Collateral Token**: SPYx (SPDR S&P 500 ETF Trust tokenized representation)
   - **Development Network Implementation**: Mock version of SPYx token for testing and development
   - **Hardcoded Value**: $670 USD (fixed value for initial development phase)
   - **Mint Authority**: External (not controlled by protocol)
   - **Decimals**: 9 (standard SPL token precision)
   - **Transfer Flow**: User → Protocol Collateral Vault
   
   **Implementation Requirements:**
   - **Mock SPYx Properties**:
     - Token Symbol: `SPYx-MOCK`
     - Fixed price oracle: Returns constant $670 USD value
     - Standard SPL token interface compliance
     - Mintable for testing purposes (controlled by test authority)
   
   **Hardcoded Value Implementation:**
   ```rust
   // In constants.rs
   pub const MOCK_SPYX_PRICE_USD: u64 = 670_000_000_000_000_000_000; // $670 * 10^18
   
   // Price oracle interface (mock implementation)
   pub fn get_spyx_price() -> Result<u64> {
       Ok(MOCK_SPYX_PRICE_USD)
   }
   ```
   
   **Technical Integration:**
   - Price retrieval through dedicated oracle interface
   - Collateral value calculations use fixed $670 rate
   - Mock price feed integrated into vault calculations
   - Test token minting utilities for development scenarios
   
   **Assumptions and Limitations:**
   - **Fixed Pricing**: No price volatility simulation during development
   - **Simplified Oracle**: Single hardcoded value without external data feeds
   - **Test Environment Only**: Mock implementation not suitable for production
   - **No Price History**: Historical price data not available in mock version
   
   **Future Considerations:**
   - **Production Migration**: Mock token will be replaced with live SPYx pricing
   - **Oracle Integration**: Real-time price feeds from Chainlink or Pyth Network
   - **Price Volatility**: Dynamic pricing will affect collateral ratios and liquidations
   - **Multi-Asset Support**: Framework designed to support additional collateral tokens
   
   **Version Control Information:**
   - **Current Version**: v1.0.0-dev (Mock Implementation)
   - **Target Version**: v2.0.0 (Live Pricing Integration)
   - **Migration Path**: Documented in `DEPLOYMENT.md` for production transition

2. **USD_RW Token** - Synthetic debt token minted by protocol
   - **Mint Authority**: ProtocolConfig PDA
   - **Decimals**: 6 (USD representation with micro-dollar precision)
   - **Minting Flow**: Protocol → User token account
   - **Backing**: Collateralized by SPYx deposits at 150% minimum ratio

## Detailed Minting Sequence

### 1. Initialization of Required Accounts

**Step 1: Protocol Initialization**
```rust
initialize_protocol(
    collateral_mint: Pubkey,
    usdrw_mint: Pubkey
)
```

**Required Accounts:**
- `owner` (Signer, mut) - Protocol owner paying for initialization
- `protocol_config` (PDA, init) - Global configuration account
- `collateral_mint` (Account<Mint>) - Collateral token mint
- `usdrw_mint` (Account<Mint>) - USD_RW token mint
- `system_program` - Solana system program

**Validation:**
- Ensures collateral_mint ≠ usdrw_mint
- Sets default parameters (150% collateral ratio, 5% interest rate, 120% liquidation threshold)

**Step 2: Collateral Vault Initialization**
```rust
initialize_collateral_vault()
```

**Required Accounts:**
- `owner` (Signer, mut) - Protocol owner
- `protocol_config` (Account<ProtocolConfig>) - Existing protocol config
- `collateral_mint` (Account<Mint>) - Collateral token mint
- `protocol_collateral_account` (PDA, init) - Protocol's collateral vault
- `token_program` - SPL Token program

### 2. Token Creation and Allocation

**Minting Process Flow:**

```rust
mint_usdrw(collateral_amount: u64)
```

**Required Accounts:**
- `user` (Signer, mut) - User initiating mint
- `protocol_config` (Account<ProtocolConfig>) - Protocol configuration
- `user_vault` (PDA, init_if_needed) - User's vault account
- `user_collateral_account` (Account<TokenAccount>, mut) - User's collateral tokens
- `protocol_collateral_account` (Account<TokenAccount>, mut) - Protocol's collateral vault
- `user_usdrw_account` (Account<TokenAccount>, mut) - User's USD_RW token account
- `usdrw_mint` (Account<Mint>, mut) - USD_RW token mint
- `token_program` - SPL Token program
- `system_program` - System program

**Calculation Logic:**
1. **Collateral Validation:**
   ```rust
   require!(collateral_amount >= MIN_COLLATERAL_AMOUNT, CdpError::BelowMinimumCollateral);
   ```

2. **Maximum Mintable Calculation:**
   ```rust
   let max_mintable = (collateral_amount * FIXED_POINT_SCALE) / protocol_config.collateral_ratio;
   let available_to_mint = max_mintable.saturating_sub(user_vault.debt_amount);
   ```

3. **Interest Update:**
   ```rust
   let time_elapsed = current_timestamp - user_vault.last_interest_update;
   let interest = (user_vault.debt_amount * protocol_config.interest_rate * time_elapsed) / 
                  (FIXED_POINT_SCALE * SECONDS_PER_YEAR);
   user_vault.debt_amount += interest;
   ```

### 3. Liquidation Mechanism

**Liquidation Process Flow:**

```rust
liquidate_vault(debt_to_liquidate: u64)
```

**Required Accounts:**
- `liquidator` (Signer, mut) - User performing the liquidation (can be vault owner)
- `protocol_config` (Account<ProtocolConfig>) - Protocol configuration
- `user_vault` (Account<UserVault>, mut) - Vault being liquidated
- `protocol_collateral_account` (Account<TokenAccount>, mut) - Protocol's collateral vault
- `liquidator_collateral_account` (Account<TokenAccount>, mut) - Liquidator's collateral account
- `liquidator_usdrw_account` (Account<TokenAccount>, mut) - Liquidator's USD_RW account
- `usdrw_mint` (Account<Mint>, mut) - USD_RW token mint
- `token_program` - SPL Token program

**Liquidation Trigger Conditions:**
1. **Undercollateralization Check:**
   ```rust
   let collateral_ratio = (user_vault.collateral_amount * FIXED_POINT_SCALE) / user_vault.debt_amount;
   require!(collateral_ratio < protocol_config.liquidation_threshold, CdpError::NotUndercollateralized);
   ```

2. **Debt Validation:**
   ```rust
   require!(user_vault.debt_amount > 0, CdpError::VaultAlreadyLiquidated);
   require!(debt_to_liquidate > 0 && debt_to_liquidate <= user_vault.debt_amount, CdpError::InvalidLiquidationAmount);
   ```

**Self-Liquidation Support:**
- **Previous Restriction**: Users were prevented from liquidating their own vaults
- **Current Implementation**: Self-liquidation is now allowed and encouraged
- **Benefits**: 
  - Users can proactively manage their positions
  - Reduces reliance on external liquidators
  - Provides better control over liquidation timing
  - Minimizes MEV extraction opportunities

**Liquidation Economics:**

1. **Liquidation Bonus Structure:**
   ```rust
   // Updated from 10% to 2% bonus
   pub const LIQUIDATION_BONUS_PERCENTAGE: u64 = 102; // 102% = 2% bonus
   
   let collateral_to_seize = debt_to_liquidate
       .checked_mul(LIQUIDATION_BONUS_PERCENTAGE)
       .unwrap()
       .checked_div(100)
       .unwrap();
   ```

2. **Economic Incentives:**
   - **Liquidation Bonus**: 2% (reduced from 10%)
   - **Liquidation Threshold**: 120% collateral ratio
   - **Minting Threshold**: 150% collateral ratio
   - **Safety Buffer**: 30% margin between minting and liquidation thresholds

**Liquidation Sequence:**
1. **Pre-execution Validations:**
   - Verify vault has outstanding debt
   - Check collateral ratio below liquidation threshold
   - Validate liquidation amount within bounds
   - Confirm liquidator has sufficient USD_RW balance

2. **State Updates:**
   ```rust
   user_vault.debt_amount = user_vault.debt_amount.saturating_sub(debt_to_liquidate);
   user_vault.collateral_amount = user_vault.collateral_amount.saturating_sub(collateral_to_seize);
   ```

3. **Token Transfers:**
   ```rust
   // Transfer seized collateral to liquidator
   anchor_spl::token::transfer(transfer_ctx, collateral_to_seize)?;
   
   // Burn liquidator's USD_RW
   anchor_spl::token::burn(burn_ctx, debt_to_liquidate)?;
   ```

**Partial Liquidation Support:**
- Liquidators can liquidate any portion of the debt
- Enables gradual position unwinding
- Reduces market impact for large positions
- Allows multiple liquidators to participate

**Risk Mitigation Features:**
1. **Collateral Shortage Protection:**
   ```rust
   require!(user_vault.collateral_amount >= collateral_to_seize, CdpError::InsufficientCollateral);
   ```

2. **Liquidator Solvency Check:**
   ```rust
   require!(liquidator_usdrw_account.amount >= debt_to_liquidate, CdpError::InsufficientUsdrwBalance);
   ```

3. **Mathematical Overflow Protection:**
   - All calculations use checked arithmetic
   - Prevents integer overflow attacks
   - Ensures calculation precision

### 4. Cross-Program Invocations

**Collateral Transfer (User → Protocol):**
```rust
let transfer_ix = Transfer {
    from: ctx.accounts.user_collateral_account.to_account_info(),
    to: ctx.accounts.protocol_collateral_account.to_account_info(),
    authority: ctx.accounts.user.to_account_info(),
};
token::transfer(CpiContext::new(ctx.accounts.token_program.to_account_info(), transfer_ix), collateral_amount)?;
```

**USD_RW Minting (Protocol → User):**
```rust
let mint_ix = MintTo {
    mint: ctx.accounts.usdrw_mint.to_account_info(),
    to: ctx.accounts.user_usdrw_account.to_account_info(),
    authority: ctx.accounts.protocol_config.to_account_info(),
};

let seeds = &[b"protocol_config", &[ctx.accounts.protocol_config.bump]];
let signer_seeds = &[&seeds[..]];

token::mint_to(
    CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        mint_ix,
        signer_seeds
    ),
    mint_amount
)?;
```

## Security Considerations

### Authorization Requirements

1. **Protocol Initialization:**
   - Only designated protocol admin can initialize
   - Hardcoded admin check (MVP limitation)

2. **Minting Authorization:**
   - User must sign transaction
   - User must own the vault being modified
   - Sufficient collateral validation

3. **PDA Authority:**
   - Protocol uses PDAs for mint authority
   - Prevents unauthorized minting
   - Seeds ensure deterministic addresses

### Anti-Fraud Measures

1. **Collateral Ratio Enforcement:**
   ```rust
   let collateral_value = user_vault.collateral_amount;
   let debt_value = user_vault.debt_amount;
   let current_ratio = (collateral_value * FIXED_POINT_SCALE) / debt_value;
   require!(current_ratio >= protocol_config.collateral_ratio, CdpError::InsufficientCollateralRatio);
   ```

2. **Interest Accrual:**
   - Automatic interest calculation on each interaction
   - Prevents debt manipulation through timing

3. **Liquidation Protection:**
   - Liquidation threshold below collateral ratio
   - Incentivizes proper collateralization

### Error Handling Scenarios

**Custom Error Types:**
- `InsufficientCollateralRatio` - Collateral ratio too low
- `ExceedsMintLimit` - Attempting to mint more than allowed
- `BelowMinimumCollateral` - Collateral amount too small
- `InvalidMintConfiguration` - Invalid token mint setup
- `UnauthorizedProtocolInitialization` - Invalid admin access

**Validation Checks:**
1. Account ownership verification
2. Token mint validation
3. Mathematical overflow protection
4. State consistency checks

## Technical Specifications

### Required Program Instructions

**Instruction Data Formats:**

1. **InitializeProtocol:**
   ```rust
   pub struct InitializeProtocolArgs {
       pub collateral_mint: Pubkey,
       pub usdrw_mint: Pubkey,
   }
   ```

2. **MintUsdrw:**
   ```rust
   pub struct MintUsdrwArgs {
       pub collateral_amount: u64,
   }
   ```

### Account Constraints and Size Requirements

**ProtocolConfig Account:**
- Size: 8 (discriminator) + 32 (owner) + 32 (collateral_mint) + 32 (usdrw_mint) + 8 (collateral_ratio) + 8 (interest_rate) + 8 (liquidation_threshold) + 8 (last_interest_update) + 1 (bump) = 137 bytes
- Rent: ~0.00114 SOL

**UserVault Account:**
- Size: 8 (discriminator) + 32 (owner) + 32 (protocol_config) + 8 (collateral_amount) + 8 (debt_amount) + 8 (last_interest_update) + 1 (bump) = 97 bytes
- Rent: ~0.00096 SOL

**Token Accounts:**
- Size: 165 bytes (standard SPL token account)
- Rent: ~0.00203 SOL each

### Fixed-Point Arithmetic

**Precision:** 18 decimal places (10^18 scale factor)
```rust
pub const FIXED_POINT_SCALE: u64 = 1_000_000_000_000_000_000; // 10^18
```

**Key Ratios:**
- Collateral Ratio: 150% (1.5 * 10^18)
- Liquidation Threshold: 120% (1.2 * 10^18)
- Liquidation Bonus: 2% (102% total = 1.02 multiplier)
- Annual Interest Rate: 5% (0.05 * 10^18)

**SPYx Pricing Constants:**
```rust
// Mock SPYx price for development (hardcoded at $670 USD)
pub const MOCK_SPYX_PRICE_USD: u64 = 670_000_000_000_000_000_000; // $670 * 10^18

// SPYx token decimals
pub const SPYX_TOKEN_DECIMALS: u8 = 9;

// Price calculation utilities
pub fn calculate_spyx_value(token_amount: u64) -> u64 {
    (token_amount * MOCK_SPYX_PRICE_USD) / (10_u64.pow(SPYX_TOKEN_DECIMALS as u32))
}

// Collateral value calculation for minting
pub fn calculate_max_mintable_usd(spyx_amount: u64, collateral_ratio: u64) -> u64 {
    let collateral_value = calculate_spyx_value(spyx_amount);
    (collateral_value * FIXED_POINT_SCALE) / collateral_ratio
}
```

**Mock Oracle Interface:**
```rust
// Price oracle trait for future extensibility
pub trait PriceOracle {
    fn get_price(&self, token_mint: &Pubkey) -> Result<u64>;
}

// Mock implementation for development
pub struct MockSpyxOracle;

impl PriceOracle for MockSpyxOracle {
    fn get_price(&self, token_mint: &Pubkey) -> Result<u64> {
        // In production, this would validate the token_mint
        // and fetch real-time pricing data
        Ok(MOCK_SPYX_PRICE_USD)
    }
}
```

### Expected Transaction Costs

**Estimated Compute Units:**
- Protocol Initialization: ~50,000 CU
- Collateral Vault Initialization: ~30,000 CU
- Mint USD_RW: ~40,000 CU
- Interest Calculation: ~10,000 CU

**Transaction Fees (approximate):**
- Base fee: 5,000 lamports
- Priority fee: Variable based on network congestion
- Account creation: Rent-exempt minimum (~0.001-0.002 SOL per account)

## Testing Requirements

### Success Case Validation Criteria

1. **Protocol Initialization Success:**
   ```typescript
   const protocolConfig = await program.account.protocolConfig.fetch(protocolConfigPDA);
   assert.equal(protocolConfig.owner.toString(), owner.publicKey.toString());
   assert.equal(protocolConfig.collateralMint.toString(), collateralMint.toString());
   assert.equal(protocolConfig.usdrwMint.toString(), usdrwMint.toString());
   ```

2. **Successful Minting Validation:**
   ```typescript
   // Check vault state
   const vault = await program.account.userVault.fetch(userVaultPDA);
   assert.equal(vault.collateralAmount.toNumber(), expectedCollateralAmount);
   assert.equal(vault.debtAmount.toNumber(), expectedDebtAmount);
   
   // Check token balances
   const userUsdrwBalance = await getTokenBalance(userUsdrwAccount);
   assert.equal(userUsdrwBalance, expectedMintedAmount);
   ```

3. **Collateral Ratio Maintenance:**
   ```typescript
   const collateralValue = vault.collateralAmount;
   const debtValue = vault.debtAmount;
   const ratio = (collateralValue * FIXED_POINT_SCALE) / debtValue;
   assert.isTrue(ratio >= COLLATERAL_RATIO);
   ```

### Edge Case Scenarios to Verify

1. **Insufficient Collateral:**
   ```typescript
   try {
     await program.methods.mintUsdrw(insufficientCollateral).rpc();
     assert.fail("Should have failed with insufficient collateral");
   } catch (error) {
     assert.include(error.message, "InsufficientCollateralRatio");
   }
   ```

2. **Maximum Debt Limit:**
   ```typescript
   // Test minting up to maximum allowed
   const maxMintable = calculateMaxMintable(collateralAmount, collateralRatio);
   await program.methods.mintUsdrw(maxMintable).rpc();
   
   // Attempt to mint beyond limit should fail
   try {
     await program.methods.mintUsdrw(1).rpc();
     assert.fail("Should have failed exceeding mint limit");
   } catch (error) {
     assert.include(error.message, "ExceedsMintLimit");
   }
   ```

3. **Interest Accrual Over Time:**
   ```typescript
   // Advance time using Bankrun
   await context.warpToSlot(currentSlot + timeAdvancement);
   
   // Trigger interest calculation
   await program.methods.calculateInterest().rpc();
   
   // Verify debt increased
   const updatedVault = await program.account.userVault.fetch(userVaultPDA);
   assert.isTrue(updatedVault.debtAmount > originalDebtAmount);
   ```

### Expected Program State Changes

**After Protocol Initialization:**
- ProtocolConfig PDA created with correct parameters
- Protocol owner set correctly
- Token mints configured

**After Collateral Vault Initialization:**
- Protocol collateral token account created
- PDA authority set correctly

**After Successful Minting:**
- User vault created/updated with collateral and debt amounts
- Collateral transferred from user to protocol
- USD_RW tokens minted to user account
- Interest timestamp updated

**State Invariants to Maintain:**
1. Total protocol collateral = Sum of all user vault collateral
2. Total USD_RW supply = Sum of all user vault debt
3. All vaults maintain minimum collateral ratio
4. Interest calculations are monotonically increasing

### Integration Test Scenarios

1. **Full Workflow Test:**
   - Initialize protocol
   - Initialize collateral vault
   - Create user accounts
   - Mint collateral tokens to user
   - Mint USD_RW tokens
   - Verify all state changes

2. **Multi-User Scenario:**
   - Multiple users with different vault positions
   - Verify isolation between vaults
   - Test concurrent operations

3. **Time-Based Testing:**
   - Interest accrual over extended periods
   - Liquidation scenarios after time advancement
   - Protocol parameter updates

4. **Liquidation Testing:**
   - Self-liquidation scenarios (vault owner liquidating own position)
   - External liquidation by third parties
   - Partial liquidation testing with various debt amounts
   - Liquidation bonus calculation verification (2% bonus)
   - Edge cases: insufficient collateral, invalid liquidation amounts
   - Multiple liquidators competing for the same vault

This specification provides a comprehensive guide for implementing and interacting with the Basalt CDP MVP minting functionality, covering all technical requirements, security considerations, and testing scenarios necessary for production deployment.