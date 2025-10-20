//! NSD Minting Program - Solana Smart Contract
//! 
//! This program manages the minting and configuration of NSD tokens on the Solana blockchain.
//! It provides functionality for initializing configurations, minting tokens, updating configurations,
//! and setting token metadata.
//!
//! The program uses the Anchor framework for Solana development and follows best practices for
//! account management, error handling, and security.

// Import required modules and macros
use anchor_lang::prelude::*;

/// Custom error codes for the NSD Minting Program
/// 
/// These errors provide specific feedback for different failure scenarios
/// in the minting process.
#[error_code]
pub enum NsdError {
    /// Error thrown when trying to mint tokens when minting is not active
    #[msg("Minting is not currently active")]
    MintingNotActive,
    
    /// Error thrown when trying to mint more tokens than the maximum supply
    #[msg("Exceeds maximum supply")]
    ExceedsMaxSupply,
    
    /// Error thrown when the user doesn't have sufficient funds to pay for minting
    #[msg("Insufficient funds for minting")]
    InsufficientFunds,
    
    /// Error thrown when an unauthorized account tries to perform admin operations
    #[msg("Unauthorized to perform this action")]
    Unauthorized,
}