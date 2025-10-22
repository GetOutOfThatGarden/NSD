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
    
    /// The protocol's collateral token account (pda)
    #[account(
        mut,
        seeds = [b"collateral_vault", protocol_config.key().as_ref()],
        bump
    )]
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

pub fn mint_usdrw(ctx: Context<MintUsdrw>, amount: u64) -> Result<()> {
    let user_vault = &mut ctx.accounts.user_vault;
    let protocol_config = &ctx.accounts.protocol_config;
    
    // Validate that the amount is above minimum
    if amount < MIN_COLLATERAL_AMOUNT {
        return err!(CdpError::BelowMinimumCollateral);
    }
    
    // Validate that the user has sufficient collateral
    let collateral_amount = ctx.accounts.user_collateral_account.amount;
    if collateral_amount == 0 {
        return err!(CdpError::InsufficientCollateralForMint);
    }
    
    // Calculate the maximum amount that can be minted based on collateral ratio
    // Maximum mint = collateral_amount * (collateral_ratio / 100)
    let max_mintable = (collateral_amount as u128 * COLLATERAL_RATIO as u128) / FIXED_POINT_SCALE as u128;
    
    if amount as u128 > max_mintable {
        return err!(CdpError::ExceedsMintLimit);
    }
    
    // Update vault debt
    user_vault.debt_amount = user_vault.debt_amount.saturating_add(amount);
    
    // Transfer collateral from user to protocol
    let cpi_accounts = Transfer {
        from: ctx.accounts.user_collateral_account.to_account_info(),
        to: ctx.accounts.protocol_collateral_account.to_account_info(),
        authority: ctx.accounts.user.to_account_info(),
    };
    
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    anchor_spl::token::transfer(cpi_ctx, amount)?;
    
    // Mint USD_RW to user
    let mint_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        anchor_spl::token::MintTo {
            mint: ctx.accounts.usdrw_mint.to_account_info(),
            to: ctx.accounts.user_usdrw_account.to_account_info(),
            authority: ctx.accounts.protocol_config.to_account_info(),
        },
    );
    
    anchor_spl::token::mint_to(mint_ctx, amount)?;
    
    Ok(())
}