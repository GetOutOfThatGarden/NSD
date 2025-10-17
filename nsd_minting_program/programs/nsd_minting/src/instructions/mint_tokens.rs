use crate::*;
use anchor_lang::prelude::*;
use std::str::FromStr;

use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
};

#[derive(Accounts)]
#[instruction(
	mint_amount: u64,
)]
pub struct MintTokens<'info> {
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
		mut,
	)]
	/// CHECK: implement manual checks if needed
	pub user_token_account: UncheckedAccount<'info>,

	pub user: Signer<'info>,

	#[account(
		init_if_needed,
		space=57,
		payer=fee_payer,
		seeds = [
			b"nsd_user",
			user.key().as_ref(),
		],
		bump,
	)]
	pub user_account: Account<'info, NsdUser>,

	pub token_mint: Account<'info, Mint>,

	pub system_program: Program<'info, System>,

	#[account(mut)]
	pub mint: Account<'info, Mint>,

	pub assoc_token_account: Account<'info, TokenAccount>,

	pub owner: Signer<'info>,

	/// CHECK: implement manual checks if needed
	pub wallet: UncheckedAccount<'info>,

	pub token_program: Program<'info, Token>,

	pub token_program: Program<'info, Token>,
}

impl<'info> MintTokens<'info> {
	pub fn cpi_token_mint_to(&self, amount: u64) -> Result<()> {
		anchor_spl::token::mint_to(
			CpiContext::new(self.token_program.to_account_info(), 
				anchor_spl::token::MintTo {
					mint: self.mint.to_account_info(),
					to: self.assoc_token_account.to_account_info(),
					authority: self.owner.to_account_info()
				}
			),
			amount, 
		)
	}
}


/// Mint NSD tokens for a user
///
/// Accounts:
/// 0. `[writable, signer]` fee_payer: [AccountInfo] 
/// 1. `[writable]` config: [NsdConfig] 
/// 2. `[writable]` user_token_account: [AccountInfo] User's token account
/// 3. `[signer]` user: [AccountInfo] User's wallet address
/// 4. `[writable]` user_account: [NsdUser] 
/// 5. `[]` token_mint: [Mint] NSD token mint account
/// 6. `[]` system_program: [AccountInfo] Auto-generated, for account initialization
/// 7. `[writable]` mint: [Mint] The mint.
/// 8. `[writable]` assoc_token_account: [Account] The account to mint tokens to.
/// 9. `[signer]` owner: [AccountInfo] The mint's minting authority.
/// 10. `[]` wallet: [AccountInfo] Wallet address for the new associated token account
/// 11. `[]` token_program: [AccountInfo] SPL Token program
/// 12. `[]` token_program: [AccountInfo] Auto-generated, TokenProgram
///
/// Data:
/// - mint_amount: [u64] Number of tokens to mint
pub fn handler(
	ctx: Context<MintTokens>,
	mint_amount: u64,
) -> Result<()> {
    // Check if minting is active
    require!(ctx.accounts.config.is_active, NsdError::MintingNotActive);
    
    // Check if we haven't exceeded max supply
    require!(
        ctx.accounts.config.total_minted + mint_amount <= ctx.accounts.config.max_supply,
        NsdError::ExceedsMaxSupply
    );
    
    // Check if user has sufficient balance to pay for minting
    let total_cost = mint_amount * ctx.accounts.config.mint_price;
    require!(
        ctx.accounts.fee_payer.lamports() >= total_cost,
        NsdError::InsufficientFunds
    );
    
    // Mint tokens to user
    ctx.accounts.cpi_token_mint_to(mint_amount)?;
    
    // Update config with new minted amount
    ctx.accounts.config.total_minted += mint_amount;
    
    // Update user account
    ctx.accounts.user_account.user = ctx.accounts.user.key();
    ctx.accounts.user_account.tokens_minted += mint_amount;
    ctx.accounts.user_account.last_mint_timestamp = Clock::get()?.unix_timestamp;
    ctx.accounts.user_account.bump = ctx.bumps.user_account;
    
    Ok(())
}