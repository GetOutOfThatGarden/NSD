//! NSD Minting Program - Solana Smart Contract
//! 
//! This program manages the minting and configuration of NSD tokens on the Solana blockchain.
//! It provides functionality for initializing configurations, minting tokens, updating configurations,
//! and setting token metadata.
//!
//! The program uses the Anchor framework for Solana development and follows best practices for
//! account management, error handling, and security.

// Import required modules and macros
use anchor_lang::prelude::*;

/// Program ID declaration
/// 
/// This declares the program's unique identifier on the Solana blockchain.
/// All accounts and instructions will be associated with this ID.
declare_id!("EMxsAQxuGEtb7QHaPYarXGvuNjz3NWX3QGsQmUb9bBgQ");

/// Main program module
/// 
/// This is the core module that contains all the instructions for the NSD Minting program.
/// Each instruction corresponds to a specific functionality of the program.
#[program]
pub mod nsd_minting {
    use super::*;

    /// Initialize the NSD minting configuration
    /// 
    /// This instruction initializes the configuration account with the provided parameters.
    /// It sets up the initial state for minting NSD tokens.
    /// 
    /// # Accounts
    /// 0. `[writable, signer]` fee_payer: [AccountInfo] 
    /// 1. `[writable]` config: [NsdConfig] 
    /// 2. `[signer]` admin: [AccountInfo] Admin authority account
    /// 3. `[]` system_program: [AccountInfo] Auto-generated, for account initialization
    /// 
    /// # Data
    /// - token_mint: [Pubkey] Mint address for NSD token
    /// - max_supply: [u64] Maximum supply of NSD tokens
    /// - mint_price: [u64] Price per NSD token in lamports
    /// 
    /// # Returns
    /// - `Result<()>` - Success or error
    pub fn initialize_config(ctx: Context<InitializeConfig>, token_mint: Pubkey, max_supply: u64, mint_price: u64) -> Result<()> {
        initialize_config::handler(ctx, token_mint, max_supply, mint_price)
    }

    /// Mint NSD tokens for a user
    /// 
    /// This instruction mints NSD tokens to a user's associated token account.
    /// It performs validation checks before minting and updates the configuration.
    /// 
    /// # Accounts
    /// 0. `[writable, signer]` fee_payer: [AccountInfo] 
    /// 1. `[writable]` config: [NsdConfig] 
    /// 2. `[writable]` user_token_account: [AccountInfo] User's token account
    /// 3. `[signer]` user: [AccountInfo] User's wallet address
    /// 4. `[writable]` user_account: [NsdUser] 
    /// 5. `[]` token_mint: [Mint] NSD token mint account
    /// 6. `[]` system_program: [AccountInfo] Auto-generated, for account initialization
    /// 7. `[writable]` mint: [Mint] The mint.
    /// 8. `[writable]` assoc_token_account: [Account] The account to mint tokens to.
    /// 9. `[signer]` owner: [AccountInfo] The mint's minting authority.
    /// 10. `[]` wallet: [AccountInfo] Wallet address for the new associated token account
    /// 11. `[]` token_program: [AccountInfo] SPL Token program
    /// 12. `[]` token_program: [AccountInfo] Auto-generated, TokenProgram
    /// 
    /// # Data
    /// - mint_amount: [u64] Number of tokens to mint
    /// 
    /// # Returns
    /// - `Result<()>` - Success or error
    pub fn mint_tokens(ctx: Context<MintTokens>, mint_amount: u64) -> Result<()> {
        mint_tokens::handler(ctx, mint_amount)
    }

    /// Update NSD minting configuration
    /// 
    /// This instruction updates the configuration parameters for NSD token minting.
    /// It allows updating maximum supply, mint price, and active status.
    /// 
    /// # Accounts
    /// 0. `[writable, signer]` fee_payer: [AccountInfo] 
    /// 1. `[writable]` config: [NsdConfig] 
    /// 2. `[signer]` admin: [AccountInfo] Admin authority account
    /// 
    /// # Data
    /// - max_supply: [Option<u64>] New maximum supply
    /// - mint_price: [Option<u64>] New mint price
    /// - is_active: [Option<bool>] New active status
    /// 
    /// # Returns
    /// - `Result<()>` - Success or error
    pub fn update_config(ctx: Context<UpdateConfig>, max_supply: Option<u64>, mint_price: Option<u64>, is_active: Option<bool>) -> Result<()> {
        update_config::handler(ctx, max_supply, mint_price, is_active)
    }

    /// Set metadata for NSD tokens
    /// 
    /// This instruction sets the metadata for NSD tokens including name, symbol, and URI.
    /// It ensures only the admin can set metadata.
    /// 
    /// # Accounts
    /// 0. `[writable, signer]` fee_payer: [AccountInfo] 
    /// 1. `[writable]` config: [NsdConfig] 
    /// 2. `[writable]` metadata: [NsdTokenMetadata] 
    /// 3. `[signer]` admin: [AccountInfo] Admin authority account
    /// 4. `[]` system_program: [AccountInfo] Auto-generated, for account initialization
    /// 
    /// # Data
    /// - token_mint: [Pubkey] Mint address for NSD token
    /// - name: [String] Name of the token
    /// - symbol: [String] Symbol of the token
    /// - uri: [String] URI for token metadata
    /// 
    /// # Returns
    /// - `Result<()>` - Success or error
    pub fn set_token_metadata(ctx: Context<SetTokenMetadata>, token_mint: Pubkey, name: String, symbol: String, uri: String) -> Result<()> {
        set_token_metadata::handler(ctx, token_mint, name, symbol, uri)
    }
}