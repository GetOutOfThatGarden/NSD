
use anchor_lang::prelude::*;

#[account]
pub struct NsdToken {
	pub mint: Pubkey,
	pub owner: Pubkey,
	pub amount: u64,
	pub bump: u8,
}
