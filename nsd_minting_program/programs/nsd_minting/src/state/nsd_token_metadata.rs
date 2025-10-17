
use anchor_lang::prelude::*;

#[account]
pub struct NsdTokenMetadata {
	pub mint: Pubkey,
	pub name: String,
	pub symbol: String,
	pub uri: String,
	pub bump: u8,
}
