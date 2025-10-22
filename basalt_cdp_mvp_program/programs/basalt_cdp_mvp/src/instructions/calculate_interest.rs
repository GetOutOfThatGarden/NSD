//! Calculate Interest Instruction
//! 
//! This instruction calculates and accrues interest on user vaults.
//! It should be called periodically to update debt amounts with accrued interest.

use anchor_lang::prelude::*;
use crate::state::protocol_config::ProtocolConfig;
use crate::state::user_vault::UserVault;
use crate::constants::*;
use crate::error::CdpError;

#[derive(Accounts)]
pub struct CalculateInterest<'info> {
    /// The user who owns the vault
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
    
    /// The system clock
    pub clock: Sysvar<'info, Clock>,
}

pub fn calculate_interest(ctx: Context<CalculateInterest>) -> Result<()> {
    let user_vault = &mut ctx.accounts.user_vault;
    let protocol_config = &ctx.accounts.protocol_config;
    let clock = &ctx.accounts.clock;
    
    // Check if interest calculation is needed (at least 1 second has passed)
    if clock.unix_timestamp <= user_vault.last_interest_update {
        return Ok(());
    }
    
    // Calculate time elapsed since last interest update
    let time_elapsed = clock.unix_timestamp - user_vault.last_interest_update;
    
    // If no time has passed, return early
    if time_elapsed <= 0 {
        return Ok(());
    }
    
    // Calculate interest amount
    // Interest = debt_amount * (interest_rate * time_elapsed) / SECONDS_PER_YEAR
    // Using fixed-point arithmetic for precision
    let time_ratio = (time_elapsed as u128 * FIXED_POINT_SCALE as u128) / SECONDS_PER_YEAR as u128;
    let interest_rate_scaled = protocol_config.interest_rate as u128;
    let debt_amount_scaled = user_vault.debt_amount as u128;
    
    // Calculate interest amount: (debt * interest_rate * time) / SECONDS_PER_YEAR
    let interest_amount = (debt_amount_scaled * interest_rate_scaled * time_ratio) / (FIXED_POINT_SCALE as u128 * FIXED_POINT_SCALE as u128);
    
    // Add interest to debt
    user_vault.debt_amount = user_vault.debt_amount.saturating_add(interest_amount as u64);
    
    // Update last interest update timestamp
    user_vault.last_interest_update = clock.unix_timestamp;
    
    Ok(())
}