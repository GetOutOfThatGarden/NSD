//! Protocol configuration state account
//! 
//! This struct defines the global configuration for the CDP protocol,
//! including collateral and debt parameters, interest rates, and thresholds.

use anchor_lang::prelude::*;

#[account]
#[derive(Debug)]
pub struct ProtocolConfig {
    /// Owner of the protocol (can modify settings)
    pub owner: Pubkey,
    
    /// Mint address for the collateral token
    pub collateral_mint: Pubkey,
    
    /// Mint address for the synthetic debt token (USD_RW)
    pub usdrw_mint: Pubkey,
    
    /// Required collateral ratio (e.g., 150% = 1.5 * 2^64)
    pub collateral_ratio: u64,
    
    /// Annual interest rate (e.g., 5% = 0.05 * 2^64)
    pub interest_rate: u64,
    
    /// Liquidation threshold ratio (e.g., 120% = 1.2 * 2^64)
    pub liquidation_threshold: u64,
    
    /// Timestamp of the last interest update
    pub last_interest_update: i64,
    
    /// Bump seed for PDA derivation
    pub bump: u8,
}