
use anchor_lang::prelude::*;

#[account]
pub struct NsdUser {
	pub user: Pubkey,
	pub tokens_minted: u64,
	pub last_mint_timestamp: i64,
	pub bump: u8,
}
