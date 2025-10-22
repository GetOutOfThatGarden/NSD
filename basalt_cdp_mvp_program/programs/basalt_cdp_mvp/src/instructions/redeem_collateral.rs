//! Redeem Collateral Instruction
//! 
//! This instruction allows users to redeem collateral from their vault by repaying debt.
//! Users can redeem collateral up to the amount they have debt for.

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
pub struct RedeemCollateral<'info> {
    /// The user who wants to redeem collateral
    #[account(mut)]
    pub user: Signer<'info>,
    
    /// The protocol configuration account
    pub protocol_config: Account<'info, ProtocolConfig>,
    
    /// The user's vault account
    #[account(
        mut,
        seeds = [b"vault", user.key().as_ref(), protocol_config.key().as_ref()],
        bump = user_vault.bump
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
}

pub fn redeem_collateral(ctx: Context<RedeemCollateral>, amount: u64) -> Result<()> {
    let user_vault = &mut ctx.accounts.user_vault;
    let protocol_config = &ctx.accounts.protocol_config;
    
    // Validate that the user has debt to redeem
    if user_vault.debt_amount == 0 {
        return err!(CdpError::NoDebtToRedeem);
    }
    
    // Validate that the amount is not greater than debt
    if amount > user_vault.debt_amount {
        return err!(CdpError::ExceedsDebt);
    }
    
    // Update vault debt
    user_vault.debt_amount = user_vault.debt_amount.saturating_sub(amount);
    
    // Transfer collateral from protocol to user
    let cpi_accounts = Transfer {
        from: ctx.accounts.protocol_collateral_account.to_account_info(),
        to: ctx.accounts.user_collateral_account.to_account_info(),
        authority: ctx.accounts.protocol_config.to_account_info(),
    };
    
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    anchor_spl::token::transfer(cpi_ctx, amount)?;
    
    // Burn USD_RW from user
    let burn_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        anchor_spl::token::Burn {
            mint: ctx.accounts.usdrw_mint.to_account_info(),
            to: ctx.accounts.user_usdrw_account.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        },
    );
    
    anchor_spl::token::burn(burn_ctx, amount)?;
    
    Ok(())
}