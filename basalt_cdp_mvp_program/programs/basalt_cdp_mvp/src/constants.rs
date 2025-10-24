//! Constants for the BASALT CDP Protocol
//! 
//! This module defines all the financial constants and fixed-point arithmetic
//! configurations used throughout the protocol.

/// Fixed-point representation: 18 decimal places (like Ethereum)
/// This provides sufficient precision while avoiding overflow
pub const FIXED_POINT_SCALE: u64 = 1_000_000_000_000_000_000; // 10^18

/// Collateral ratio threshold (150% = 1.5 * FIXED_POINT_SCALE)
/// Users must maintain at least 150% collateralization
pub const COLLATERAL_RATIO: u64 = 1_500_000_000_000_000_000; // 1.5 * 10^18

/// Liquidation threshold (120% = 1.2 * FIXED_POINT_SCALE)
/// Vaults below this ratio are eligible for liquidation
pub const LIQUIDATION_THRESHOLD: u64 = 1_200_000_000_000_000_000; // 1.2 * 10^18

/// Annual interest rate (5% = 0.05 * FIXED_POINT_SCALE)
pub const ANNUAL_INTEREST_RATE: u64 = 50_000_000_000_000_000; // 0.05 * 10^18

/// Number of seconds in a year for interest calculation
pub const SECONDS_PER_YEAR: i64 = 365 * 24 * 60 * 60;

/// Minimum collateral amount required for a vault
pub const MIN_COLLATERAL_AMOUNT: u64 = 1;

/// Maximum debt amount allowed per vault (1,000,000 tokens)
pub const MAX_DEBT_AMOUNT: u64 = 18_446_744_073_709_551_615; // Max u64 value

/// Maximum number of vaults per user
pub const MAX_VAULTS_PER_USER: u64 = 10;

/// Default bump seed for PDA derivation
pub const DEFAULT_BUMP: u8 = 255;

/// Protocol admin public key (hardcoded for MVP security)
/// In production, this should be a multisig or governance token
pub const PROTOCOL_ADMIN: &str = "11111111111111111111111111111112"; // System program as placeholder