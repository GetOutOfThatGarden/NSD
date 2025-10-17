use crate::*;
use anchor_lang::prelude::*;
use std::str::FromStr;

use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
};

#[derive(Accounts)]
#[instruction(
	max_supply: Option<u64>,
	mint_price: Option<u64>,
	is_active: Option<bool>,
)]
pub struct UpdateConfig<'info> {
	#[account(
		mut,
	)]
	pub fee_payer: Signer<'info>,

	#[account(
		mut,
		seeds = [
			b"nsd_config",
		],
		bump,
	)]
	pub config: Account<'info, NsdConfig>,

	pub admin: Signer<'info>,
}

/// Update NSD minting configuration
///
/// Accounts:
/// 0. `[writable, signer]` fee_payer: [AccountInfo] 
/// 1. `[writable]` config: [NsdConfig] 
/// 2. `[signer]` admin: [AccountInfo] Admin authority account
///
/// Data:
/// - max_supply: [Option<u64>] New maximum supply
/// - mint_price: [Option<u64>] New mint price
/// - is_active: [Option<bool>] New active status
pub fn handler(
	ctx: Context<UpdateConfig>,
	max_supply: Option<u64>,
	mint_price: Option<u64>,
	is_active: Option<bool>,
) -> Result<()> {
    // Check if admin is the owner
    require!(ctx.accounts.config.admin == ctx.accounts.admin.key(), NsdError::Unauthorized);
    
    // Update max supply if provided
    if let Some(supply) = max_supply {
        ctx.accounts.config.max_supply = supply;
    }
    
    // Update mint price if provided
    if let Some(price) = mint_price {
        ctx.accounts.config.mint_price = price;
    }
    
    // Update active status if provided
    if let Some(active) = is_active {
        ctx.accounts.config.is_active = active;
    }
    
    Ok(())
}