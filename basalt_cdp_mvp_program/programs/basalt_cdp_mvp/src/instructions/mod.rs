//! CDP Protocol Instructions
//! 
//! This module contains all the instruction implementations for the BASALT CDP Protocol.
//! Each instruction corresponds to a core function in the CDP system.

pub mod initialize_protocol;
pub mod mint_usdrw;
pub mod redeem_collateral;
pub mod liquidate_vault;
pub mod calculate_interest;

pub use initialize_protocol::*;
pub use mint_usdrw::*;
pub use redeem_collateral::*;
pub use liquidate_vault::*;
pub use calculate_interest::*;