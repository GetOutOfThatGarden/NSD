//! User vault state account
//! 
//! This struct defines the individual user's position in the CDP protocol,
//! tracking their collateral, debt, and interest information.

use anchor_lang::prelude::*;

#[account]
#[derive(Debug)]
pub struct UserVault {
    /// Owner of this vault
    pub owner: Pubkey,
    
    /// Reference to the protocol configuration
    pub protocol_config: Pubkey,
    
    /// Amount of collateral deposited (fixed-point 64.64)
    pub collateral_amount: u64,
    
    /// Amount of debt owed (fixed-point 64.64)
    pub debt_amount: u64,
    
    /// Timestamp of the last interest update
    pub last_interest_update: i64,
    
    /// Bump seed for PDA derivation
    pub bump: u8,
}