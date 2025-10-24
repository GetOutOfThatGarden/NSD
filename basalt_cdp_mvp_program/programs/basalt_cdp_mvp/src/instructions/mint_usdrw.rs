//! Mint USD_RW Instruction
//! 
//! This instruction allows users to mint synthetic USD_RW tokens by depositing collateral.
//! The amount minted is determined by the collateral ratio and current collateral amount.

use anchor_lang::prelude::*;
use anchor_spl::{
    token::{Token, TokenAccount, Mint, Transfer},
    associated_token::AssociatedToken,
};
use crate::state::protocol_config::ProtocolConfig;
use crate::state::user_vault::UserVault;
use crate::constants::*;
use crate::error::CdpError;

#[derive(Accounts)]
pub struct MintUsdrw<'info> {
    /// The user who wants to mint USD_RW
    #[account(mut)]
    pub user: Signer<'info>,
    
    /// The protocol configuration account
    pub protocol_config: Account<'info, ProtocolConfig>,
    
    /// The user's vault account
    #[account(
        init_if_needed,
        payer = user,
        space = 8 + std::mem::size_of::<UserVault>(),
        seeds = [b"vault", user.key().as_ref(), protocol_config.key().as_ref()],
        bump
    )]
    pub user_vault: Account<'info, UserVault>,
    
    /// The user's collateral token account
    pub user_collateral_account: Account<'info, TokenAccount>,
    
    /// The protocol's collateral vault account
    #[account(mut)]
    pub protocol_collateral_account: Account<'info, TokenAccount>,
    
    /// The user's USD_RW token account
    pub user_usdrw_account: Account<'info, TokenAccount>,
    
    /// The protocol's USD_RW mint account
    pub usdrw_mint: Account<'info, Mint>,
    
    /// The token program
    pub token_program: Program<'info, Token>,
    
    /// The system program
    pub system_program: Program<'info, System>,
}

pub fn mint_usdrw(ctx: Context<MintUsdrw>, collateral_amount: u64) -> Result<()> {
    let user_vault = &mut ctx.accounts.user_vault;
    let protocol_config = &ctx.accounts.protocol_config;
    
    // Validate that the collateral amount is above minimum
    if collateral_amount < MIN_COLLATERAL_AMOUNT {
        return err!(CdpError::BelowMinimumCollateral);
    }
    
    // Validate that the user has sufficient collateral in their account
    if ctx.accounts.user_collateral_account.amount < collateral_amount {
        return err!(CdpError::InsufficientCollateralForMint);
    }
    
    // Validate that the protocol has mint authority for USD_RW
    if ctx.accounts.usdrw_mint.mint_authority != anchor_lang::solana_program::program_option::COption::Some(protocol_config.key()) {
        return err!(CdpError::ProtocolNotInitialized);
    }
    
    // Calculate the maximum amount that can be minted based on collateral ratio
    // For safety, use the total collateral (existing + new) to calculate max mintable
    let total_collateral = user_vault.collateral_amount.saturating_add(collateral_amount);
    
    // Check for overflow in collateral ratio calculation
    let max_mintable = total_collateral
        .checked_mul(COLLATERAL_RATIO)
        .and_then(|result| result.checked_div(FIXED_POINT_SCALE))
        .ok_or(CdpError::InterestCalculationFailed)?;
    
    // Calculate how much can actually be minted (max_mintable - existing_debt)
    let available_to_mint = max_mintable.saturating_sub(user_vault.debt_amount);
    
    if available_to_mint == 0 {
        return err!(CdpError::ExceedsMintLimit);
    }
    
    // The amount to mint is the available amount (we mint the maximum possible)
    let mint_amount = available_to_mint;
    
    // Update vault state BEFORE any external calls
    user_vault.collateral_amount = user_vault.collateral_amount.saturating_add(collateral_amount);
    user_vault.debt_amount = user_vault.debt_amount.saturating_add(mint_amount);
    
    // Initialize vault if this is the first time
    if user_vault.owner == Pubkey::default() {
        user_vault.owner = ctx.accounts.user.key();
        user_vault.protocol_config = protocol_config.key();
        user_vault.last_interest_update = Clock::get()?.unix_timestamp;
        user_vault.bump = ctx.bumps.user_vault;
    }
    
    // Transfer collateral from user to protocol
    let cpi_accounts = Transfer {
        from: ctx.accounts.user_collateral_account.to_account_info(),
        to: ctx.accounts.protocol_collateral_account.to_account_info(),
        authority: ctx.accounts.user.to_account_info(),
    };
    
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    anchor_spl::token::transfer(cpi_ctx, collateral_amount)?;
    
    // Create PDA seeds for protocol authority
    let protocol_seeds = &[
        b"protocol_config".as_ref(),
        &[protocol_config.bump],
    ];
    let signer_seeds = &[&protocol_seeds[..]];
    
    // Mint USD_RW to user using protocol PDA authority
    let mint_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        anchor_spl::token::MintTo {
            mint: ctx.accounts.usdrw_mint.to_account_info(),
            to: ctx.accounts.user_usdrw_account.to_account_info(),
            authority: protocol_config.to_account_info(),
        },
        signer_seeds,
    );
    
    anchor_spl::token::mint_to(mint_ctx, mint_amount)?;
    
    Ok(())
}