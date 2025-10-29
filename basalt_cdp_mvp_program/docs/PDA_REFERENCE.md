# Basalt CDP Protocol - PDA Reference Guide

## Overview

This document provides a comprehensive reference for all Program Derived Addresses (PDAs) used in the Basalt CDP Protocol. PDAs are deterministic addresses that allow the program to own accounts and sign transactions programmatically.

**Program ID**: `5gzoSxVDDSjdE3pPYu9GuyaDAyV2uBXm34BvWa5epsv3`

## Core Protocol PDAs

### 1. Protocol Configuration PDA

**Purpose**: Stores global protocol settings and parameters

**Seeds**: `["protocol_config"]`

**TypeScript Example**:
```typescript
const [protocolConfigPDA, bump] = PublicKey.findProgramAddressSync(
  [Buffer.from('protocol_config')],
  BASALT_PROGRAM_ID
);
```

**Rust Implementation**:
```rust
#[account(
    init,
    payer = admin,
    space = 8 + ProtocolConfig::INIT_SPACE,
    seeds = [b"protocol_config"],
    bump
)]
pub protocol_config: Account<'info, ProtocolConfig>,
```

**Account Data**:
- Collateral mint address
- USD_RW mint address  
- Protocol admin public key
- Interest rates and financial parameters
- Protocol fees and settings

---

### 2. User Vault PDA

**Purpose**: Individual user CDP (Collateralized Debt Position) account

**Seeds**: `["user_vault", user_pubkey, protocol_config_pubkey]`

**TypeScript Example**:
```typescript
const [userVaultPDA, bump] = PublicKey.findProgramAddressSync(
  [
    Buffer.from('user_vault'),
    userPublicKey.toBuffer(),
    protocolConfigPDA.toBuffer()
  ],
  BASALT_PROGRAM_ID
);
```

**Rust Implementation**:
```rust
#[account(
    init,
    payer = user,
    space = 8 + UserVault::INIT_SPACE,
    seeds = [b"user_vault", user.key().as_ref(), protocol_config.key().as_ref()],
    bump
)]
pub user_vault: Account<'info, UserVault>,
```

**Account Data**:
- User's public key
- Collateral amount deposited
- USD_RW debt amount
- Last interest calculation timestamp
- Vault creation timestamp
- Bump seed for PDA derivation

---

### 3. Protocol Collateral Vault PDA

**Purpose**: Protocol-owned token account that holds all user collateral

**Seeds**: `["collateral_vault", protocol_config_pubkey]`

**TypeScript Example**:
```typescript
const [collateralVaultPDA, bump] = PublicKey.findProgramAddressSync(
  [
    Buffer.from('collateral_vault'),
    protocolConfigPDA.toBuffer()
  ],
  BASALT_PROGRAM_ID
);
```

**Rust Implementation**:
```rust
#[account(
    init,
    payer = admin,
    token::mint = collateral_mint,
    token::authority = protocol_config,
    seeds = [b"collateral_vault", protocol_config.key().as_ref()],
    bump
)]
pub protocol_collateral_account: Account<'info, TokenAccount>,
```

**Account Data**:
- SPL Token Account owned by protocol_config PDA
- Holds all user collateral deposits
- Used for liquidations and withdrawals

---

### 4. Mint Authority PDAs

**Purpose**: Act as mint authorities for protocol-controlled SPL Token mints.

**Seeds**:
- SPYx Mint Authority: `["spyx_mint_authority"]`
- USDrw Mint Authority: `["usdrw_mint_authority"]`

**TypeScript Example**:
```typescript
const [spyxMintAuthority] = PublicKey.findProgramAddressSync(
  [Buffer.from('spyx_mint_authority')],
  BASALT_PROGRAM_ID
);
const [usdrwMintAuthority] = PublicKey.findProgramAddressSync(
  [Buffer.from('usdrw_mint_authority')],
  BASALT_PROGRAM_ID
);
```

**Rust Usage (CPI with invoke_signed)**:
```rust
// Derive PDA inside instruction handler
let (usdrw_mint_authority, bump) = Pubkey::find_program_address(&[b"usdrw_mint_authority"], ctx.program_id);
let signer_seeds: &[&[u8]] = &[b"usdrw_mint_authority", &[bump]];

// Example: mint USDrw via CPI
token::mint_to(
    CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        token::MintTo {
            mint: ctx.accounts.usdrw_mint.to_account_info(),
            to: ctx.accounts.user_usdrw_ata.to_account_info(),
            authority: ctx.accounts.usdrw_mint_authority.to_account_info(),
        },
        &[signer_seeds],
    ),
    amount,
)?;
```

**Notes**:
- PDAs do not need an initialized account to be used as authorities.
- Set the mint's `mint_authority` to the PDA address during deployment.
- The program must sign using `invoke_signed` with the correct seeds and bump.

---

## PDA Seed Patterns

### Standard Seed Types

1. **String Literals**: Fixed strings that identify the account type
   - `"protocol_config"`
   - `"user_vault"`
   - `"collateral_vault"`

2. **Public Keys**: Variable seeds based on user or account addresses
   - `user.key().as_ref()` - User's wallet address
   - `protocol_config.key().as_ref()` - Protocol config PDA address

3. **Bump Seeds**: Automatically generated to ensure address is off curve
   - Stored in account data for future derivations
   - Found using `findProgramAddressSync()`

### Seed Ordering Convention

The Basalt protocol follows this seed ordering pattern:
1. **Account Type** (string literal)
2. **Primary Key** (user pubkey, mint address, etc.)
3. **Parent/Context** (protocol_config, parent PDA, etc.)

Example: `["user_vault", user_pubkey, protocol_config_pubkey]`

---

## Advanced PDA Examples

### Custom User Data PDAs

For extending user functionality, you can create additional PDAs:

```typescript
// User preferences
const [userPreferencesPDA] = PublicKey.findProgramAddressSync(
  [
    Buffer.from('user_preferences'),
    userPublicKey.toBuffer(),
    protocolConfigPDA.toBuffer()
  ],
  BASALT_PROGRAM_ID
);

// Liquidation history
const [liquidationHistoryPDA] = PublicKey.findProgramAddressSync(
  [
    Buffer.from('liquidation_history'),
    userPublicKey.toBuffer(),
    protocolConfigPDA.toBuffer()
  ],
  BASALT_PROGRAM_ID
);
```

### Multi-Vault Support

For users with multiple vaults (future feature):

```typescript
const vaultIndex = 0; // First vault
const [userVaultPDA] = PublicKey.findProgramAddressSync(
  [
    Buffer.from('user_vault'),
    userPublicKey.toBuffer(),
    new Uint8Array([vaultIndex]), // Vault index as seed
    protocolConfigPDA.toBuffer()
  ],
  BASALT_PROGRAM_ID
);
```

---

## PDA Security Considerations

### 1. Seed Validation
- Always validate that derived PDAs match expected addresses
- Verify bump seeds are stored correctly in account data
- Check that all required seeds are provided

### 2. Authority Verification
- PDAs can only be signed by the owning program
- Ensure proper authority checks in instruction handlers
- Validate that PDAs are derived with correct seeds

### 3. Account Ownership
- PDAs must be owned by the correct program
- Check account discriminators to ensure correct account types
- Validate account data structure matches expected format

---

## Common PDA Operations

### Creating a PDA
```typescript
import { PublicKey } from '@solana/web3.js';

const BASALT_PROGRAM_ID = new PublicKey('5gzoSxVDDSjdE3pPYu9GuyaDAyV2uBXm34BvWa5epsv3');

const [pda, bump] = PublicKey.findProgramAddressSync(
  [Buffer.from('protocol_config')],
  BASALT_PROGRAM_ID
);
```

### Verifying a PDA
```typescript
function verifyPDA(address: PublicKey, seeds: Buffer[]): boolean {
  const [derivedPDA] = PublicKey.findProgramAddressSync(seeds, BASALT_PROGRAM_ID);
  return derivedPDA.equals(address);
}
```

### Using PDAs in Instructions
```typescript
// In your instruction call
await program.methods
  .mintUsdrw(collateralAmount, usdrwAmount)
  .accounts({
    user: userPublicKey,
    userVault: userVaultPDA,
    protocolConfig: protocolConfigPDA,
    protocolCollateralAccount: collateralVaultPDA,
    // ... other accounts
  })
  .rpc();
```

---

## Troubleshooting

### Common Issues

1. **Invalid PDA**: Seeds don't match expected pattern
   - Solution: Verify seed order and types match the program

2. **Bump Mismatch**: Stored bump doesn't match derived bump
   - Solution: Use the bump returned by `findProgramAddressSync()`

3. **Wrong Program ID**: Using incorrect program ID for derivation
   - Solution: Ensure you're using the correct deployed program ID

4. **Account Not Found**: PDA hasn't been initialized yet
   - Solution: Call the appropriate initialization instruction first

### Debugging Tips

1. Log the derived PDA address and compare with expected
2. Verify all seeds are correctly formatted (Buffer.from() for strings)
3. Check that the program ID matches the deployed program
4. Ensure the account has been initialized before use

---

## Integration Examples

See the following files for practical PDA usage:

- `/examples/create-pdas.ts` - Complete PDA creation examples
- `/app/solana/pdas.ts` - Frontend PDA utilities
- `/tests/basalt_cdp_mvp.ts` - Test implementations
- `/scripts/test-devnet.ts` - Devnet interaction examples

---

## References

- [Solana PDA Documentation](https://docs.solana.com/developing/programming-model/calling-between-programs#program-derived-addresses)
- [Anchor PDA Guide](https://www.anchor-lang.com/docs/pdas)
- [Basalt CDP Protocol Documentation](./MINTING_PROCESS_SPECIFICATION.md)
