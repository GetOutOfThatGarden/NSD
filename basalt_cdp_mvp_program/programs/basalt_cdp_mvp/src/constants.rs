//! Constants for the BASALT CDP Protocol
//! 
//! This module defines all the financial constants and fixed-point arithmetic
//! configurations used throughout the protocol.

/// Fixed-point representation: 64.64 bits
/// This means 64 bits for the integer part and 64 bits for the fractional part
pub const FIXED_POINT_SCALE: u64 = 1u64 << 64;

/// Collateral ratio threshold (150% = 1.5 * FIXED_POINT_SCALE)
/// Users must maintain at least 150% collateralization
pub const COLLATERAL_RATIO: u64 = 150 * FIXED_POINT_SCALE / 100;

/// Liquidation threshold (120% = 1.2 * FIXED_POINT_SCALE)
/// Vaults below this ratio are eligible for liquidation
pub const LIQUIDATION_THRESHOLD: u64 = 120 * FIXED_POINT_SCALE / 100;

/// Annual interest rate (5% = 0.05 * FIXED_POINT_SCALE)
pub const ANNUAL_INTEREST_RATE: u64 = 5 * FIXED_POINT_SCALE / 100;

/// Number of seconds in a year for interest calculation
pub const SECONDS_PER_YEAR: i64 = 365 * 24 * 60 * 60;

/// Minimum collateral amount required for a vault
pub const MIN_COLLATERAL_AMOUNT: u64 = 1;

/// Maximum debt amount allowed per vault
pub const MAX_DEBT_AMOUNT: u64 = 1000000 * FIXED_POINT_SCALE;

/// Maximum number of vaults per user
pub const MAX_VAULTS_PER_USER: u64 = 10;

/// Default bump seed for PDA derivation
pub const DEFAULT_BUMP: u8 = 255;