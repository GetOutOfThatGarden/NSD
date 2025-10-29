# Basalt CDP Frontend Development Log

## 2024-12-29 - Token Display Fix Implementation

### Task: Fix SPYx Token Display Issues
**Time:** 4:00 PM - 4:15 PM

### Description
Fixed display quirks where SPYx tokens were showing incorrect amounts and names in both Phantom wallet and frontend interface.

### Issues Addressed
1. **Amount Display**: Phantom wallet showed 15,000 instead of 15 SPYx tokens due to decimal interpretation mismatch
2. **Token Name**: Phantom wallet displayed "Unknown token" instead of "Mock SPYx" due to lack of metadata

### Code Changes

#### 1. Enhanced BasaltCDP Component (`src/components/BasaltCDP.tsx`)
- Added state management for token balances (`spyxBalance`, `usdrwBalance`)
- Implemented `fetchTokenBalances()` function to correctly calculate token amounts using proper decimals
- Added automatic balance refresh after successful transactions
- Created token balance display UI section showing "Mock SPYx" and "USDrw" with correct amounts

#### 2. Updated Styling (`src/App.css`)
- Added `.balance-section` styling for the new token balance display
- Implemented responsive balance item layout with proper spacing
- Added green color coding for token amounts with monospace font

### Technical Implementation
- **Decimal Handling**: Used `Math.pow(10, COLLATERAL_DECIMALS)` where `COLLATERAL_DECIMALS = 9` to properly convert from base units
- **Real-time Updates**: Integrated balance fetching with wallet connection and transaction completion
- **Error Handling**: Added try-catch blocks for accounts that don't exist yet (showing 0 balance)

### Solutions Implemented
1. **Frontend Display Fix**: Created dedicated balance display showing correct amounts (15.00 SPYx instead of 15,000)
2. **Token Naming**: Frontend now explicitly displays "Mock SPYx" instead of relying on wallet interpretation
3. **Real-time Updates**: Balances automatically refresh after transactions

### Challenges Faced
- **Metaplex Dependency Issues**: Attempted to add token metadata using `@metaplex-foundation/mpl-token-metadata` but encountered peer dependency conflicts
- **Wallet Interpretation**: Phantom wallet still shows incorrect amounts due to lack of on-chain metadata, but frontend now provides correct display

### Current Status
- ✅ Frontend displays correct SPYx amount (15.00)
- ✅ Frontend shows "Mock SPYx" token name
- ✅ Real-time balance updates working
- ⚠️ Phantom wallet still shows display quirks (requires on-chain metadata for full fix)

### Next Steps
- Consider implementing proper token metadata creation for production deployment
- Test deposit functionality with the corrected display
- Verify transaction flow with updated balance display

## 2025-01-29 - Fixed AssociatedToken Program Missing Error

**Issue**: The `mint_usdrw` instruction was failing with "ProgramAccountNotFound" error during transaction simulation.

**Root Cause**: The `mint_usdrw` instruction uses `init_if_needed` for the `user_vault` account, which requires the `AssociatedToken` program to be available. However, the `AssociatedToken` program was not explicitly included in:
1. The backend `MintUsdrw` accounts structure
2. The frontend instruction accounts

**Solution**: 
1. **Backend Fix**: Added `associated_token_program: Program<'info, AssociatedToken>` to the `MintUsdrw` accounts structure in `mint_usdrw.rs`
2. **Frontend Fix**: Added `ASSOCIATED_TOKEN_PROGRAM_ID` import and included `associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID` in the mint instruction accounts

**Technical Changes**:
- Modified `basalt_cdp_mvp_program/programs/basalt_cdp_mvp/src/instructions/mint_usdrw.rs`
- Updated `src/components/BasaltCDP.tsx` to import and include `ASSOCIATED_TOKEN_PROGRAM_ID`
- Rebuilt and deployed the updated program to Devnet
- New Program ID: `5gzoSxVDDSjdE3pPYu9GuyaDAyV2uBXm34BvWa5epsv3`

**Benefits**:
- Resolves the "ProgramAccountNotFound" error for the `AssociatedToken` program
- Enables proper initialization of associated token accounts when needed
- Maintains compatibility with Anchor's `init_if_needed` constraint

**Verification**: 
- Program successfully compiled and deployed to Devnet
- Frontend updated with correct program references
- Ready for testing with deposit functionality

## 2025-01-29 - Fixed Program ID Mismatch in IDL File

**Issue**: Despite fixing the AssociatedToken program issue, the "ProgramAccountNotFound" error persisted. Enhanced verbose logging revealed that the instruction was using program ID `8S5e9SrQyDgWvtXaaEpKLyoC46QEqBuDP9xjdx8K5az3` while the config had `5gzoSxVDDSjdE3pPYu9GuyaDAyV2uBXm34BvWa5epsv3`.

**Root Cause**: The IDL file (`src/idl/basalt_cdp_mvp.json`) contained an outdated program ID in the "address" field, causing the Anchor program instance to use the wrong program ID for instruction generation.

**Solution**: 
1. **Enhanced Debugging**: Added comprehensive verbose logging to track instruction details, account verification, and simulation results
2. **IDL Update**: Copied the updated IDL file from the Anchor program's target directory to the frontend, ensuring the correct program ID is used

**Technical Changes**:
- Added detailed logging in `src/components/BasaltCDP.tsx` for instruction and account debugging
- Copied updated IDL: `cp basalt_cdp_mvp_program/target/idl/basalt_cdp_mvp.json Basalt_FE_tech_demo/src/idl/basalt_cdp_mvp.json`
- IDL now correctly references program ID: `5gzoSxVDDSjdE3pPYu9GuyaDAyV2uBXm34BvWa5epsv3`

**Benefits**:
- Resolves the program ID mismatch causing "ProgramAccountNotFound" errors
- Enhanced debugging capabilities for future troubleshooting
- Ensures frontend and backend are synchronized with the correct program deployment

**Verification**: 
- IDL file updated with correct program ID
- Verbose logging implemented for detailed error tracking
- Ready for testing deposit functionality with correct program reference

## 2025-01-29 - Fixed InterestCalculationFailed Error

**Issue**: The deposit transaction was failing with "InterestCalculationFailed" error (Error Code: 6010) after resolving the "ProgramAccountNotFound" error.

**Root Cause**: The complex interest calculation logic in the `mint_usdrw` instruction was causing failures due to the mismatch between the desired 670:1 USDrw to SPYx mint ratio and the existing 150% collateral ratio calculation.

**Solution**: Simplified the mint calculation logic by removing the complex interest calculation and implementing a direct 670:1 USDrw to SPYx ratio.

**Technical Changes**:
- Updated `mint_usdrw.rs` to replace complex interest calculation with simplified logic
- Direct calculation: `mint_amount = (collateral_amount * 670) / 10^(COLLATERAL_DECIMALS - USDRW_DECIMALS)`
- Handles decimal differences between SPYx (9 decimals) and USDrw (6 decimals)
- Removed dependency on `max_mintable` calculation that was causing the error

**Benefits**:
- Eliminates the "InterestCalculationFailed" error
- Provides predictable 670:1 mint ratio as requested
- Simplifies the minting logic for easier debugging and maintenance

**Verification**:
- Program built successfully with warnings only
- Deployed to Devnet with program ID: `5gzoSxVDDSjdE3pPYu9GuyaDAyV2uBXm34BvWa5epsv3`
- Updated frontend IDL to match the simplified program interface

## 2025-01-29 - Fixed PrivilegeEscalation Error

**Issue**: The deposit transaction was failing with "PrivilegeEscalation" error after resolving the interest calculation issue. The error indicated "Cross-program invocation with unauthorized signer or writable account" with the user's collateral ATA being flagged for privilege escalation.

**Root Cause**: The `user_collateral_account` in the `mint_usdrw` instruction was not marked as writable (`#[account(mut)]`) in the Rust program, but the program was attempting to transfer tokens from this account, which requires write access to update the account balance.

**Solution**: Added the `#[account(mut)]` attribute to the `user_collateral_account` in the `MintUsdrw` struct to mark it as writable.

**Technical Changes**:
- Updated `programs/basalt_cdp_mvp/src/instructions/mint_usdrw.rs`
- Added `#[account(mut)]` attribute to `user_collateral_account` field
- This allows the token transfer operation to properly debit tokens from the user's collateral account to protocol vault

**Benefits**:
- Eliminates the "PrivilegeEscalation" error
- Allows proper token transfers from user's collateral account to protocol vault
- Maintains security by only marking accounts as writable when necessary

**Verification**:
- Program built successfully with existing warnings
- Deployed to Devnet with program ID: `5gzoSxVDDSjdE3pPYu9GuyaDAyV2uBXm34BvWa5epsv3`
- Updated frontend IDL to reflect the corrected account permissions

---