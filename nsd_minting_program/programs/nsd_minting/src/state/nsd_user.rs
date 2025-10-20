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

/// User minting history structure
/// 
/// This struct tracks information about a user's minting activities.
/// It includes user identity, minted token count, and timestamp of last mint.
#[account]
pub struct NsdUser {
    /// The user's public key
    pub user: Pubkey,
    
    /// Total number of tokens minted by this user
    pub tokens_minted: u64,
    
    /// Unix timestamp of the last mint operation
    pub last_mint_timestamp: i64,
    
    /// Bump seed for the user account
    pub bump: u8,
}