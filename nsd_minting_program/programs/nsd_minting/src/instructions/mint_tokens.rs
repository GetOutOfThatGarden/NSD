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

/// Accounts required for minting NSD tokens
/// 
/// This struct defines the accounts needed for the mint_tokens instruction.
/// It includes the fee payer, configuration account, user accounts, and token program accounts.
#[derive(Accounts)]
#[instruction(
    mint_amount: u64,
)]
pub struct MintTokens<'info> {
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

    /// User's token account (unchecked due to dynamic nature)
    /// This account will hold the minted tokens
    #[account(
        mut,
    )]
    /// CHECK: implement manual checks if needed
    pub user_token_account: UncheckedAccount<'info>,

    /// The user who is minting tokens
    /// Must be a signer account
    pub user: Signer<'info>,

    /// The user account that tracks minting history
    /// Initialized if needed with specific space and seeds
    #[account(
        init_if_needed,
        space=57,
        payer=fee_payer,
        seeds = [
            b"nsd_user",
            user.key().as_ref(),
        ],
        bump,
    )]
    pub user_account: Account<'info, NsdUser>,

    /// The token mint account for NSD tokens
    /// This is the SPL token mint account
    pub token_mint: Account<'info, Mint>,

    /// The system program account for account initialization
    pub system_program: Program<'info, System>,

    /// The mint account for the token being minted
    /// Must be mutable
    #[account(mut)]
    pub mint: Account<'info, Mint>,

    /// The associated token account for the user
    /// This is where the minted tokens will be sent
    pub assoc_token_account: Account<'info, TokenAccount>,

    /// The owner of the mint account (authority)
    /// Must be a signer account
    pub owner: Signer<'info>,

    /// The wallet account for the new associated token account
    /// CHECK: implement manual checks if needed
    /// This is used for creating associated token accounts
    /// CHECK: implement manual checks if needed
    pub wallet: UncheckedAccount<'info>,

    /// The SPL Token program account
    pub token_program: Program<'info, Token>,
}

/// Implementation of helper methods for MintTokens
impl<'info> MintTokens<'info> {
    /// CPI (Cross-Program Invocation) to mint tokens to an account
    /// 
    /// This method performs a cross-program invocation to the SPL Token program
    /// to mint tokens to the specified associated token account.
    /// 
    /// # Parameters
    /// - `amount` - The amount of tokens to mint
    /// 
    /// # Returns
    /// - `Result<()>` - Success or error
    pub fn cpi_token_mint_to(&self, amount: u64) -> Result<()> {
        anchor_spl::token::mint_to(
            CpiContext::new(self.token_program.to_account_info(), 
                anchor_spl::token::MintTo {
                    mint: self.mint.to_account_info(),
                    to: self.assoc_token_account.to_account_info(),
                    authority: self.owner.to_account_info()
                }
            ),
            amount, 
        )
    }
}

/// Mint NSD tokens for a user
/// 
/// This instruction mints NSD tokens to a user's associated token account.
/// It performs validation checks before minting and updates the configuration.
/// 
/// # Accounts
/// - `fee_payer` - Writable, signer - The account paying for transaction fees
/// - `config` - Writable - The configuration account
/// - `user_token_account` - Writable - User's token account
/// - `user` - Signer - The user who is minting tokens
/// - `user_account` - Writable - User's minting history account
/// - `token_mint` - Mint - The NSD token mint account
/// - `system_program` - System program - Required for account initialization
/// - `mint` - Mint - The mint account for the token being minted
/// - `assoc_token_account` - Token account - The associated token account for the user
/// - `owner` - Signer - The mint's minting authority
/// - `wallet` - Wallet address - Wallet address for the new associated token account
/// - `token_program` - SPL Token program - The SPL Token program account
/// 
/// # Parameters
/// - `mint_amount` - Number of tokens to mint
/// 
/// # Returns
/// - `Result<()>` - Success or error
pub fn handler(
    ctx: Context<MintTokens>,
    mint_amount: u64,
) -> Result<()> {
    // Check if minting is active
    // If not active, throw an error
    require!(ctx.accounts.config.is_active, NsdError::MintingNotActive);
    
    // Check if we haven't exceeded max supply
    // If minting would exceed the maximum supply, throw an error
    require!(
        ctx.accounts.config.total_minted + mint_amount <= ctx.accounts.config.max_supply,
        NsdError::ExceedsMaxSupply
    );
    
    // Check if user has sufficient balance to pay for minting
    // Calculate the total cost of minting
    let total_cost = mint_amount * ctx.accounts.config.mint_price;
    // If the fee payer doesn't have enough lamports, throw an error
    require!(
        ctx.accounts.fee_payer.lamports() >= total_cost,
        NsdError::InsufficientFunds
    );
    
    // Mint tokens to user
    // Perform the CPI to mint tokens using the helper method
    ctx.accounts.cpi_token_mint_to(mint_amount)?;
    
    // Update config with new minted amount
    // Increment the total minted count in the configuration
    ctx.accounts.config.total_minted += mint_amount;
    
    // Update user account
    // Set the user's public key
    ctx.accounts.user_account.user = ctx.accounts.user.key();
    // Increment the user's minted token count
    ctx.accounts.user_account.tokens_minted += mint_amount;
    // Set the timestamp of the last mint
    ctx.accounts.user_account.last_mint_timestamp = Clock::get()?.unix_timestamp;
    // Store the bump seed for the user account
    ctx.accounts.user_account.bump = ctx.bumps.user_account;
    
    Ok(())
}