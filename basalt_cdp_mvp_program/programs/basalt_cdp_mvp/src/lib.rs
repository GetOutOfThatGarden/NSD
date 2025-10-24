//! Main program entry point and module exports
//! 
//! This file serves as the main entry point for the BASALT CDP Protocol program.
//! It exports all the necessary modules and instructions for the program to function.

pub mod instructions;
pub mod state;
pub mod constants;
pub mod error;

use anchor_lang::prelude::*;
use instructions::*;

// Environment-specific program IDs using Cargo features
#[cfg(all(feature = "localnet", not(any(feature = "devnet", feature = "testnet", feature = "mainnet-beta"))))]
declare_id!("8S5e9SrQyDgWvtXaaEpKLyoC46QEqBuDP9xjdx8K5az3");

#[cfg(feature = "devnet")]
declare_id!("8S5e9SrQyDgWvtXaaEpKLyoC46QEqBuDP9xjdx8K5az3");

#[cfg(feature = "testnet")]
declare_id!("8S5e9SrQyDgWvtXaaEpKLyoC46QEqBuDP9xjdx8K5az3");

#[cfg(feature = "mainnet-beta")]
declare_id!("8S5e9SrQyDgWvtXaaEpKLyoC46QEqBuDP9xjdx8K5az3");

#[program]
pub mod basalt_cdp_mvp {
    use super::*;

    /// Initialize the protocol with configuration parameters
    pub fn initialize_protocol(
        ctx: Context<InitializeProtocol>,
        _collateral_mint: Pubkey,
        _usdrw_mint: Pubkey,
    ) -> Result<()> {
        initialize_protocol::initialize_protocol(ctx)
    }

    /// Mint USD_RW tokens by depositing collateral
    pub fn mint_usdrw(ctx: Context<MintUsdrw>, amount: u64) -> Result<()> {
        mint_usdrw::mint_usdrw(ctx, amount)
    }

    /// Redeem collateral by repaying debt
    pub fn redeem_collateral(ctx: Context<RedeemCollateral>, amount: u64) -> Result<()> {
        redeem_collateral::redeem_collateral(ctx, amount)
    }

    /// Liquidate an undercollateralized vault
    pub fn liquidate_vault(ctx: Context<LiquidateVault>, vault: Pubkey) -> Result<()> {
        liquidate_vault::liquidate_vault(ctx, vault)
    }

    /// Calculate and accrue interest on vaults
    pub fn calculate_interest(ctx: Context<CalculateInterest>) -> Result<()> {
        calculate_interest::calculate_interest(ctx)
    }
}