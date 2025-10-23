//! Liquidate Vault Instruction
//! 
//! This instruction allows users to liquidate undercollateralized vaults.
//! When a vault is below the liquidation threshold, any user can liquidate it
//! and receive collateral at a discount.

use anchor_lang::prelude::*;
use anchor_spl::{
    token::{Token, TokenAccount, Mint, Transfer, Burn},
    associated_token::AssociatedToken,
};
use crate::state::protocol_config::ProtocolConfig;
use crate::state::user_vault::UserVault;
use crate::constants::*;
use crate::error::CdpError;

#[derive(Accounts)]
pub struct LiquidateVault<'info> {
    /// The user who wants to liquidate the vault
    #[account(mut)]
    pub liquidator: Signer<'info>,
    
    /// The protocol configuration account
    pub protocol_config: Account<'info, ProtocolConfig>,
    
    /// The vault to be liquidated
    #[account(
        mut,
        seeds = [b"vault", user.key().as_ref(), protocol_config.key().as_ref()],
        bump = user_vault.bump
    )]
    pub user_vault: Account<'info, UserVault>,
    
    /// The user who owns the vault
    pub user: AccountInfo<'info>,
    
    /// The user's collateral token account
    pub user_collateral_account: Account<'info, TokenAccount>,
    
    /// The protocol's collateral token account (pda)
    #[account(
        mut,
        seeds = [b"collateral_vault", protocol_config.key().as_ref()],
        bump
    )]
    pub protocol_collateral_account: Account<'info, TokenAccount>,
    
    /// The liquidator's collateral token account
    pub liquidator_collateral_account: Account<'info, TokenAccount>,
    
    /// The protocol's USD_RW mint account
    pub usdrw_mint: Account<'info, Mint>,
    
    /// The token program
    pub token_program: Program<'info, Token>,
}

pub fn liquidate_vault(ctx: Context<LiquidateVault>, _vault: Pubkey) -> Result<()> {
    let user_vault = &mut ctx.accounts.user_vault;
    let protocol_config = &ctx.accounts.protocol_config;
    
    // Validate that the vault is undercollateralized
    if user_vault.debt_amount == 0 {
        return err!(CdpError::NoDebtToRedeem);
    }
    
    // Calculate current collateral ratio
    // Collateral ratio = (collateral_amount * FIXED_POINT_SCALE) / debt_amount
    let collateral_ratio = if user_vault.debt_amount > 0 {
        (user_vault.collateral_amount as u128 * FIXED_POINT_SCALE as u128) / user_vault.debt_amount as u128
    } else {
        u128::MAX
    };
    
    // Check if vault is under the liquidation threshold
    if collateral_ratio >= protocol_config.liquidation_threshold as u128 {
        return err!(CdpError::NotUndercollateralized);
    }
    
    // Calculate liquidation amount (partial liquidation)
    // For simplicity, we'll liquidate all debt
    let liquidation_amount = user_vault.debt_amount;
    
    // Transfer collateral from protocol to liquidator
    let cpi_accounts = Transfer {
        from: ctx.accounts.protocol_collateral_account.to_account_info(),
        to: ctx.accounts.liquidator_collateral_account.to_account_info(),
        authority: ctx.accounts.protocol_config.to_account_info(),
    };
    
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    anchor_spl::token::transfer(cpi_ctx, liquidation_amount)?;
    
    // Burn USD_RW from user
    let burn_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        anchor_spl::token::Burn {
            mint: ctx.accounts.usdrw_mint.to_account_info(),
            from: ctx.accounts.user_collateral_account.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        },
    );
    
    anchor_spl::token::burn(burn_ctx, liquidation_amount)?;
    
    // Update vault debt
    user_vault.debt_amount = 0;
    
    Ok(())
}