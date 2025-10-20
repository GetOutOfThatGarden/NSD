//! NSD Minting Program - Solana Smart Contract
//! 
//! This program manages the minting and configuration of NSD tokens on the Solana blockchain.
//! It provides functionality for initializing configurations, minting tokens, updating configurations,
//! and setting token metadata.
//!
//! The program uses the Anchor framework for Solana development and follows best practices for
//! account management, error handling, and security.

// Import required modules and macros
use crate::*;
use anchor_lang::prelude::*;
use std::str::FromStr;

use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
};

/// Accounts required for setting token metadata
/// 
/// This struct defines the accounts needed for the set_token_metadata instruction.
/// It includes the fee payer, configuration account, metadata account, and admin authority.
#[derive(Accounts)]
#[instruction(
    token_mint: Pubkey,
    name: String,
    symbol: String,
    uri: String,
)]
pub struct SetTokenMetadata<'info> {
    /// The fee payer for account initialization
    /// Must be a writable signer account
    #[account(mut)]
    pub fee_payer: Signer<'info>,

    /// The configuration account that stores minting parameters
    /// Must be mutable and seeded with "nsd_config"
    #[account(
        mut,
        seeds = [
            b"nsd_config",
        ],
        bump,
    )]
    pub config: Account<'info, NsdConfig>,

    /// The metadata account that stores token metadata
    /// This account is initialized with specific space and seeds
    #[account(
        init,
        space=295,
        payer=fee_payer,
        seeds = [
            b"metadata",
            token_mint.as_ref(),
        ],
        bump,
    )]
    pub metadata: Account<'info, NsdTokenMetadata>,

    /// The admin authority account that can set metadata
    /// Must be a signer account
    pub admin: Signer<'info>,

    /// The system program account for account initialization
    pub system_program: Program<'info, System>,
}

/// Set metadata for NSD tokens
/// 
/// This instruction sets the metadata for NSD tokens including name, symbol, and URI.
/// It ensures only the admin can set metadata.
/// 
/// # Accounts
/// - `fee_payer` - Writable, signer - The account paying for transaction fees
/// - `config` - Writable - The configuration account
/// - `metadata` - Writable - The metadata account to be initialized
/// - `admin` - Signer - The admin authority account
/// - `system_program` - System program - Required for account initialization
/// 
/// # Parameters
/// - `token_mint` - Mint address for NSD token
/// - `name` - Name of the token
/// - `symbol` - Symbol of the token
/// - `uri` - URI for token metadata
/// 
/// # Returns
/// - `Result<()>` - Success or error
pub fn handler(
    ctx: Context<SetTokenMetadata>,
    token_mint: Pubkey,
    name: String,
    symbol: String,
    uri: String,
) -> Result<()> {
    // Check if admin is the owner
    // Verify that the caller is the admin authority
    require!(ctx.accounts.config.admin == ctx.accounts.admin.key(), NsdError::Unauthorized);
    
    // Set metadata values
    // Store the token mint address
    ctx.accounts.metadata.mint = token_mint;
    // Store the token name
    ctx.accounts.metadata.name = name;
    // Store the token symbol
    ctx.accounts.metadata.symbol = symbol;
    // Store the token URI
    ctx.accounts.metadata.uri = uri;
    // Store the bump seed for the metadata account
    ctx.accounts.metadata.bump = ctx.bumps.metadata;
    
    Ok(())
}