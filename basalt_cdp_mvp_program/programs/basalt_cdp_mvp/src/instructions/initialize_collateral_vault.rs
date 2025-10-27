//! Initialize Protocol Collateral Vault Instruction
//!
//! Creates the protocol's collateral token account at the PDA
//! `seeds = [b"collateral_vault", protocol_config]` with the
//! protocol config PDA as the account authority and the collateral
//! mint as the token mint.

use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount, Mint};

use crate::state::protocol_config::ProtocolConfig;
use crate::error::CdpError;

#[derive(Accounts)]
pub struct InitializeCollateralVault<'info> {
    /// Protocol owner who pays for account initialization
    #[account(mut)]
    pub owner: Signer<'info>,

    /// Protocol configuration account (PDA authority for vault)
    pub protocol_config: Account<'info, ProtocolConfig>,

    /// Collateral mint used by the protocol
    pub collateral_mint: Account<'info, Mint>,

    /// Protocol collateral vault token account (PDA)
    #[account(
        init,
        payer = owner,
        seeds = [b"collateral_vault", protocol_config.key().as_ref()],
        bump,
        token::mint = collateral_mint,
        token::authority = protocol_config,
    )]
    pub protocol_collateral_account: Account<'info, TokenAccount>,

    /// Token program
    pub token_program: Program<'info, Token>,

    /// System program
    pub system_program: Program<'info, System>,
}

pub fn initialize_collateral_vault(
    ctx: Context<InitializeCollateralVault>,
) -> Result<()> {
    // Restrict initialization to protocol owner
    require!(
        ctx.accounts.protocol_config.owner == ctx.accounts.owner.key(),
        CdpError::InvalidProtocolAdmin
    );

    // Account is created via constraints; no additional state needed
    Ok(())
}