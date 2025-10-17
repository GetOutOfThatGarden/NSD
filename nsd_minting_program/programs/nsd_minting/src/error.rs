use anchor_lang::prelude::*;

#[error_code]
pub enum NsdError {
    #[msg("Minting is not currently active")]
    MintingNotActive,
    #[msg("Exceeds maximum supply")]
    ExceedsMaxSupply,
    #[msg("Insufficient funds for minting")]
    InsufficientFunds,
    #[msg("Unauthorized to perform this action")]
    Unauthorized,
}