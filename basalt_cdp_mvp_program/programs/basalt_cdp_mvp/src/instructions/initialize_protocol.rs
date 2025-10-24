//! Initialize Protocol Instruction
//! 
//! This instruction initializes the protocol configuration account
//! with the required parameters and settings.

use anchor_lang::prelude::*;
use anchor_spl::token::Mint;
use crate::state::protocol_config::ProtocolConfig;
use crate::constants::*;
use crate::error::CdpError;

#[derive(Accounts)]
pub struct InitializeProtocol<'info> {
    /// The account that will own the protocol
    #[account(mut)]
    pub owner: Signer<'info>,
    
    /// The protocol configuration account to be initialized
    #[account(
        init,
        payer = owner,
        space = 8 + std::mem::size_of::<ProtocolConfig>(),
        seeds = [b"protocol_config"],
        bump
    )]
    pub protocol_config: Account<'info, ProtocolConfig>,
    
    /// The collateral mint account
    pub collateral_mint: Account<'info, Mint>,
    
    /// The synthetic debt mint account (USD_RW)
    pub usdrw_mint: Account<'info, Mint>,
    
    pub system_program: Program<'info, System>,
}

pub fn initialize_protocol(ctx: Context<InitializeProtocol>) -> Result<()> {
    let protocol_config = &mut ctx.accounts.protocol_config;
    
    // Validate that the mints are different
    if ctx.accounts.collateral_mint.key() == ctx.accounts.usdrw_mint.key() {
        return err!(CdpError::InvalidMintConfiguration);
    }
    
    // Initialize protocol configuration
    protocol_config.owner = ctx.accounts.owner.key();
    protocol_config.collateral_mint = ctx.accounts.collateral_mint.key();
    protocol_config.usdrw_mint = ctx.accounts.usdrw_mint.key();
    protocol_config.collateral_ratio = COLLATERAL_RATIO;
    protocol_config.interest_rate = ANNUAL_INTEREST_RATE;
    protocol_config.liquidation_threshold = LIQUIDATION_THRESHOLD;
    protocol_config.last_interest_update = Clock::get()?.unix_timestamp;
    protocol_config.bump = ctx.bumps.protocol_config;
    
    Ok(())
}