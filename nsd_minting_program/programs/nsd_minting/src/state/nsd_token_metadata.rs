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

/// Token metadata structure for NSD tokens
/// 
/// This struct stores the metadata for NSD tokens including name, symbol, and URI.
/// It's used to store and retrieve token metadata information.
#[account]
pub struct NsdTokenMetadata {
    /// The mint address for the token
    pub mint: Pubkey,
    
    /// Name of the token
    pub name: String,
    
    /// Symbol of the token
    pub symbol: String,
    
    /// URI for token metadata
    pub uri: String,
    
    /// Bump seed for the metadata account
    pub bump: u8,
}