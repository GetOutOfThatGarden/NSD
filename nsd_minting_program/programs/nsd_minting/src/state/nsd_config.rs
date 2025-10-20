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

/// Configuration structure for NSD minting
/// 
/// This struct stores the configuration parameters for NSD token minting.
/// It includes admin authority, token mint address, supply limits, pricing, and status.
#[account]
pub struct NsdConfig {
    /// The admin authority who can modify configuration
    pub admin: Pubkey,
    
    /// The mint address for NSD token
    pub token_mint: Pubkey,
    
    /// Maximum supply of NSD tokens
    pub max_supply: u64,
    
    /// Price per NSD token in lamports
    pub mint_price: u64,
    
    /// Total number of tokens already minted
    pub total_minted: u64,
    
    /// Whether minting is currently active
    pub is_active: bool,
    
    /// Bump seed for the configuration account
    pub bump: u8,
}