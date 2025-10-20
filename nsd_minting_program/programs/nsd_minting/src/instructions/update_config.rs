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

/// Accounts required for updating the NSD minting configuration
/// 
/// This struct defines the accounts needed for the update_config instruction.
/// It includes the fee payer, configuration account, and admin authority.
#[derive(Accounts)]
#[instruction(
    max_supply: Option<u64>,
    mint_price: Option<u64>,
    is_active: Option<bool>,
)]
pub struct UpdateConfig<'info> {
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

    /// The admin authority account that can modify configuration
    /// Must be a signer account
    pub admin: Signer<'info>,
}

/// Update NSD minting configuration
/// 
/// This instruction updates the configuration parameters for NSD token minting.
/// It allows updating maximum supply, mint price, and active status.
/// 
/// # Accounts
/// - `fee_payer` - Writable, signer - The account paying for transaction fees
/// - `config` - Writable - The configuration account to update
/// - `admin` - Signer - The admin authority account
/// 
/// # Parameters
/// - `max_supply` - New maximum supply (optional)
/// - `mint_price` - New mint price (optional)
/// - `is_active` - New active status (optional)
/// 
/// # Returns
/// - `Result<()>` - Success or error
pub fn handler(
    ctx: Context<UpdateConfig>,
    max_supply: Option<u64>,
    mint_price: Option<u64>,
    is_active: Option<bool>,
) -> Result<()> {
    // Check if admin is the owner
    // Verify that the caller is the admin authority
    require!(ctx.accounts.config.admin == ctx.accounts.admin.key(), NsdError::Unauthorized);
    
    // Update max supply if provided
    // If a new max supply is provided, update the configuration
    if let Some(supply) = max_supply {
        ctx.accounts.config.max_supply = supply;
    }
    
    // Update mint price if provided
    // If a new mint price is provided, update the configuration
    if let Some(price) = mint_price {
        ctx.accounts.config.mint_price = price;
    }
    
    // Update active status if provided
    // If a new active status is provided, update the configuration
    if let Some(active) = is_active {
        ctx.accounts.config.is_active = active;
    }
    
    Ok(())
}