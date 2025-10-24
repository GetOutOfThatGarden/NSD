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
    #[account(mut)]
    pub user_collateral_account: Account<'info, TokenAccount>,
    
    /// The protocol's collateral token account (pda)
    #[account(
        mut,
        seeds = [b"collateral_vault", protocol_config.key().as_ref()],
        bump
    )]
    pub protocol_collateral_account: Account<'info, TokenAccount>,
    
    /// The user's USD_RW token account
    #[account(mut)]
    pub user_usdrw_account: Account<'info, TokenAccount>,
    
    /// The protocol's USD_RW mint account
    #[account(mut)]
    pub usdrw_mint: Account<'info, Mint>,
    
    /// The token program
    pub token_program: Program<'info, Token>,
}

pub fn redeem_collateral(ctx: Context<RedeemCollateral>, usdrw_amount: u64) -> Result<()> {
    let user_vault = &mut ctx.accounts.user_vault;
    let protocol_config = &ctx.accounts.protocol_config;
    
    // Validate that the user has debt to redeem
    if user_vault.debt_amount == 0 {
        return err!(CdpError::NoDebtToRedeem);
    }
    
    // Validate that the USD_RW amount is not greater than debt
    if usdrw_amount > user_vault.debt_amount {
        return err!(CdpError::ExceedsDebt);
    }
    
    // Validate that the user has enough USD_RW tokens
    if ctx.accounts.user_usdrw_account.amount < usdrw_amount {
        return err!(CdpError::InsufficientCollateralForMint);
    }
    
    // Calculate collateral to return (1:1 ratio for simplicity in MVP)
    // In a real system, this would use oracle prices
    let collateral_to_return = usdrw_amount;
    
    // Validate that the vault has enough collateral
    if user_vault.collateral_amount < collateral_to_return {
        return err!(CdpError::NoCollateralToLiquidate);
    }
    
    // Update vault state BEFORE external calls
    user_vault.debt_amount = user_vault.debt_amount.saturating_sub(usdrw_amount);
    user_vault.collateral_amount = user_vault.collateral_amount.saturating_sub(collateral_to_return);
    
    // Create PDA seeds for protocol authority
    let protocol_seeds = &[
        b"protocol_config".as_ref(),
        &[protocol_config.bump],
    ];
    let signer_seeds = &[&protocol_seeds[..]];
    
    // Burn USD_RW from user using protocol authority
    let burn_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        anchor_spl::token::Burn {
            mint: ctx.accounts.usdrw_mint.to_account_info(),
            from: ctx.accounts.user_usdrw_account.to_account_info(),
            authority: protocol_config.to_account_info(),
        },
        signer_seeds,
    );
    
    anchor_spl::token::burn(burn_ctx, usdrw_amount)?;
    
    // Transfer collateral from protocol to user
    let transfer_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.protocol_collateral_account.to_account_info(),
            to: ctx.accounts.user_collateral_account.to_account_info(),
            authority: protocol_config.to_account_info(),
        },
        signer_seeds,
    );
    
    anchor_spl::token::transfer(transfer_ctx, collateral_to_return)?;
    
    Ok(())
}