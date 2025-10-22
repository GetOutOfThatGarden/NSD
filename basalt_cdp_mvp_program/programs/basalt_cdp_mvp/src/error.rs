//! Error definitions for the BASALT CDP Protocol
//! 
//! This module defines all custom errors that can be thrown by the program
//! to provide clear feedback to users and frontend applications.

use anchor_lang::prelude::*;

#[error_code]
pub enum CdpError {
    /// Error when the collateral ratio is insufficient
    #[msg("Insufficient collateral ratio")]
    InsufficientCollateralRatio,
    
    /// Error when the vault is undercollateralized
    #[msg("Vault is undercollateralized")]
    Undercollateralized,
    
    /// Error when the vault is already liquidated
    #[msg("Vault is already liquidated")]
    VaultAlreadyLiquidated,
    
    /// Error when the user tries to mint more than allowed
    #[msg("Mint amount exceeds allowed limit")]
    ExceedsMintLimit,
    
    /// Error when the user tries to redeem more than they have
    #[msg("Redeem amount exceeds debt")]
    ExceedsDebt,
    
    /// Error when the user tries to deposit less than minimum
    #[msg("Collateral amount below minimum")]
    BelowMinimumCollateral,
    
    /// Error when the user tries to create too many vaults
    #[msg("Maximum vaults per user exceeded")]
    MaxVaultsExceeded,
    
    /// Error when the vault has no debt to redeem
    #[msg("Vault has no debt to redeem")]
    NoDebtToRedeem,
    
    /// Error when the vault has no collateral to liquidate
    #[msg("Vault has no collateral to liquidate")]
    NoCollateralToLiquidate,
    
    /// Error when the vault is not undercollateralized
    #[msg("Vault is not undercollateralized")]
    NotUndercollateralized,
    
    /// Error when the interest calculation fails
    #[msg("Interest calculation failed")]
    InterestCalculationFailed,
    
    /// Error when the protocol is not initialized
    #[msg("Protocol not initialized")]
    ProtocolNotInitialized,
    
    /// Error when the vault is not found
    #[msg("Vault not found")]
    VaultNotFound,
    
    /// Error when the user tries to liquidate their own vault
    #[msg("Cannot liquidate your own vault")]
    CannotLiquidateOwnVault,
    
    /// Error when the user tries to mint with insufficient collateral
    #[msg("Insufficient collateral for minting")]
    InsufficientCollateralForMint,
}