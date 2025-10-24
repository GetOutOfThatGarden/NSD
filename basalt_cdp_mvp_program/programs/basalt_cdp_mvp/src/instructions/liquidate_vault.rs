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
    
    /// The protocol's collateral token account (pda)
    #[account(
        mut,
        seeds = [b"collateral_vault", protocol_config.key().as_ref()],
        bump
    )]
    pub protocol_collateral_account: Account<'info, TokenAccount>,
    
    /// The liquidator's collateral token account
    #[account(mut)]
    pub liquidator_collateral_account: Account<'info, TokenAccount>,
    
    /// The liquidator's USD_RW token account (to burn USD_RW)
    #[account(mut)]
    pub liquidator_usdrw_account: Account<'info, TokenAccount>,
    
    /// The protocol's USD_RW mint account
    #[account(mut)]
    pub usdrw_mint: Account<'info, Mint>,
    
    /// The token program
    pub token_program: Program<'info, Token>,
}

pub fn liquidate_vault(ctx: Context<LiquidateVault>, debt_to_liquidate: u64) -> Result<()> {
    let user_vault = &mut ctx.accounts.user_vault;
    let protocol_config = &ctx.accounts.protocol_config;
    
    // Validate that the vault has debt to liquidate
    if user_vault.debt_amount == 0 {
        return err!(CdpError::NoDebtToRedeem);
    }
    
    // Validate that the liquidator is not the vault owner
    if ctx.accounts.liquidator.key() == user_vault.owner {
        return err!(CdpError::CannotLiquidateOwnVault);
    }
    
    // Validate liquidation amount
    if debt_to_liquidate == 0 || debt_to_liquidate > user_vault.debt_amount {
        return err!(CdpError::ExceedsDebt);
    }
    
    // Calculate current collateral ratio
    // Collateral ratio = (collateral_amount * FIXED_POINT_SCALE) / debt_amount
    let collateral_ratio = if user_vault.debt_amount > 0 {
        user_vault.collateral_amount
            .checked_mul(FIXED_POINT_SCALE)
            .and_then(|result| result.checked_div(user_vault.debt_amount))
            .ok_or(CdpError::InterestCalculationFailed)?
    } else {
        u64::MAX
    };
    
    // Check if vault is under the liquidation threshold
    if collateral_ratio >= protocol_config.liquidation_threshold {
        return err!(CdpError::NotUndercollateralized);
    }
    
    // Calculate collateral to seize with liquidation bonus (10% bonus)
    // collateral_to_seize = debt_to_liquidate * 1.1 (110% of debt value)
    let liquidation_bonus = 110; // 110% = 10% bonus
    let collateral_to_seize = debt_to_liquidate
        .checked_mul(liquidation_bonus)
        .and_then(|result| result.checked_div(100))
        .ok_or(CdpError::InterestCalculationFailed)?;
    
    // Ensure we don't seize more collateral than available
    let actual_collateral_to_seize = collateral_to_seize.min(user_vault.collateral_amount);
    
    // Validate that liquidator has enough USD_RW to burn
    if ctx.accounts.liquidator_usdrw_account.amount < debt_to_liquidate {
        return err!(CdpError::InsufficientCollateralForMint);
    }
    
    // Update vault state BEFORE external calls
    user_vault.debt_amount = user_vault.debt_amount.saturating_sub(debt_to_liquidate);
    user_vault.collateral_amount = user_vault.collateral_amount.saturating_sub(actual_collateral_to_seize);
    
    // Create PDA seeds for protocol authority
    let protocol_seeds = &[
        b"protocol_config".as_ref(),
        &[protocol_config.bump],
    ];
    let signer_seeds = &[&protocol_seeds[..]];
    
    // Transfer collateral from protocol to liquidator
    let transfer_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.protocol_collateral_account.to_account_info(),
            to: ctx.accounts.liquidator_collateral_account.to_account_info(),
            authority: protocol_config.to_account_info(),
        },
        signer_seeds,
    );
    
    anchor_spl::token::transfer(transfer_ctx, actual_collateral_to_seize)?;
    
    // Burn USD_RW from liquidator using protocol authority
    let burn_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        Burn {
            mint: ctx.accounts.usdrw_mint.to_account_info(),
            from: ctx.accounts.liquidator_usdrw_account.to_account_info(),
            authority: protocol_config.to_account_info(),
        },
        signer_seeds,
    );
    
    anchor_spl::token::burn(burn_ctx, debt_to_liquidate)?;
    
    Ok(())
}