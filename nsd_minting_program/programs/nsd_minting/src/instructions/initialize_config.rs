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

/// Accounts required for initializing the NSD minting configuration
/// 
/// This struct defines the accounts needed for the initialize_config instruction.
/// It includes the fee payer, configuration account, admin authority, and system program.
#[derive(Accounts)]
#[instruction(
    token_mint: Pubkey,
    max_supply: u64,
    mint_price: u64,
)]
pub struct InitializeConfig<'info> {
    /// The fee payer for account initialization
    /// Must be a writable signer account
    #[account(mut)]
    pub fee_payer: Signer<'info>,

    /// The configuration account that stores minting parameters
    /// This account is initialized with specific space and seeds
    #[account(
        init,
        space=98,
        payer=fee_payer,
        seeds = [
            b"nsd_config",
        ],
        bump,
    )]
    pub config: Account<'info, NsdConfig>,

    /// The admin authority account that can modify configuration
    /// Must be a signer account
    pub admin: Signer<'info>,

    /// The system program account for account initialization
    pub system_program: Program<'info, System>,
}

/// Initialize the NSD minting configuration
/// 
/// This instruction initializes the configuration account with the provided parameters.
/// It sets up the initial state for minting NSD tokens.
/// 
/// # Accounts
/// - `fee_payer` - Writable, signer - The account paying for account initialization
/// - `config` - Writable - The configuration account to be initialized
/// - `admin` - Signer - The admin authority account
/// - `system_program` - System program - Required for account initialization
/// 
/// # Parameters
/// - `token_mint` - The mint address for NSD token
/// - `max_supply` - Maximum supply of NSD tokens
/// - `mint_price` - Price per NSD token in lamports
/// 
/// # Returns
/// - `Result<()>` - Success or error
pub fn handler(
    ctx: Context<InitializeConfig>,
    token_mint: Pubkey,
    max_supply: u64,
    mint_price: u64,
) -> Result<()> {
    // Set the configuration values
    // Store the admin authority
    ctx.accounts.config.admin = ctx.accounts.admin.key();
    // Store the token mint address
    ctx.accounts.config.token_mint = token_mint;
    // Set the maximum supply
    ctx.accounts.config.max_supply = max_supply;
    // Set the mint price per token
    ctx.accounts.config.mint_price = mint_price;
    // Initialize total minted to zero
    ctx.accounts.config.total_minted = 0;
    // Set minting to active by default
    ctx.accounts.config.is_active = true;
    // Store the bump seed for the config account
    ctx.accounts.config.bump = ctx.bumps.config;

    Ok(())
}