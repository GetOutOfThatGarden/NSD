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
	name: String,
	symbol: String,
	uri: String,
)]
pub struct SetTokenMetadata<'info> {
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

	#[account(
		init,
		space=295,
		payer=fee_payer,
		seeds = [
			b"metadata",
			token_mint.as_ref(),
		],
		bump,
	)]
	pub metadata: Account<'info, NsdTokenMetadata>,

	pub admin: Signer<'info>,

	pub system_program: Program<'info, System>,
}

/// Set metadata for NSD tokens
///
/// Accounts:
/// 0. `[writable, signer]` fee_payer: [AccountInfo] 
/// 1. `[writable]` config: [NsdConfig] 
/// 2. `[writable]` metadata: [NsdTokenMetadata] 
/// 3. `[signer]` admin: [AccountInfo] Admin authority account
/// 4. `[]` system_program: [AccountInfo] Auto-generated, for account initialization
///
/// Data:
/// - token_mint: [Pubkey] Mint address for NSD token
/// - name: [String] Name of the token
/// - symbol: [String] Symbol of the token
/// - uri: [String] URI for token metadata
pub fn handler(
	ctx: Context<SetTokenMetadata>,
	token_mint: Pubkey,
	name: String,
	symbol: String,
	uri: String,
) -> Result<()> {
    // Check if admin is the owner
    require!(ctx.accounts.config.admin == ctx.accounts.admin.key(), NsdError::Unauthorized);
    
    // Set metadata values
    ctx.accounts.metadata.mint = token_mint;
    ctx.accounts.metadata.name = name;
    ctx.accounts.metadata.symbol = symbol;
    ctx.accounts.metadata.uri = uri;
    ctx.accounts.metadata.bump = ctx.bumps.metadata;
    
    Ok(())
}