
use anchor_lang::prelude::*;

#[account]
pub struct NsdConfig {
	pub admin: Pubkey,
	pub token_mint: Pubkey,
	pub max_supply: u64,
	pub mint_price: u64,
	pub total_minted: u64,
	pub is_active: bool,
	pub bump: u8,
}
