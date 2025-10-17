use crate::*;
use anchor_lang::prelude::*;
use std::str::FromStr;

use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
};

#[derive(Accounts)]
#[instruction(
	token_mint: Pubkey,
	max_supply: u64,
	mint_price: u64,
)]
pub struct InitializeConfig<'info> {
	#[account(
		mut,
	)]
	pub fee_payer: Signer<'info>,

	#[account(
		init,
		space=98,
		payer=fee_payer,
		seeds = [
			b"nsd_config",
		],
		bump,
	)]
	pub config: Account<'info, NsdConfig>,

	pub admin: Signer<'info>,

	pub system_program: Program<'info, System>,
}

/// Initialize the NSD minting configuration
///
/// Accounts:
/// 0. `[writable, signer]` fee_payer: [AccountInfo] 
/// 1. `[writable]` config: [NsdConfig] 
/// 2. `[signer]` admin: [AccountInfo] Admin authority account
/// 3. `[]` system_program: [AccountInfo] Auto-generated, for account initialization
///
/// Data:
/// - token_mint: [Pubkey] Mint address for NSD token
/// - max_supply: [u64] Maximum supply of NSD tokens
/// - mint_price: [u64] Price per NSD token in lamports
pub fn handler(
	ctx: Context<InitializeConfig>,
	token_mint: Pubkey,
	max_supply: u64,
	mint_price: u64,
) -> Result<()> {
    // Set the configuration values
    ctx.accounts.config.admin = ctx.accounts.admin.key();
    ctx.accounts.config.token_mint = token_mint;
    ctx.accounts.config.max_supply = max_supply;
    ctx.accounts.config.mint_price = mint_price;
    ctx.accounts.config.total_minted = 0;
    ctx.accounts.config.is_active = true;
    ctx.accounts.config.bump = ctx.bumps.config;

    Ok(())
}