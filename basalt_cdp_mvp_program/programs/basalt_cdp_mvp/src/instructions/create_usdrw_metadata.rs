//! Create USDrw metadata via CPI to Metaplex Token Metadata
//!
//! This instruction creates the metadata account for the protocol's USDrw mint.
//! It uses the `protocol_config` PDA as the mint authority via `invoke_signed`.

use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::invoke_signed;
use anchor_spl::token::Mint;
use mpl_token_metadata::accounts::Metadata;
use mpl_token_metadata::instructions::{CreateMetadataAccountV3, CreateMetadataAccountV3InstructionArgs};
use mpl_token_metadata::types::DataV2;
use mpl_token_metadata::ID as METADATA_ID;

use crate::state::protocol_config::ProtocolConfig;
use crate::error::CdpError;

#[derive(Accounts)]
pub struct CreateUsdrwMetadata<'info> {
    /// Protocol owner pays for account creation and becomes update authority
    #[account(mut)]
    pub owner: Signer<'info>,

    /// Protocol configuration PDA (mint authority for USDrw)
    pub protocol_config: Account<'info, ProtocolConfig>,

    /// USDrw mint account
    pub usdrw_mint: Account<'info, Mint>,

    /// CHECK: Metaplex metadata account is created by the token-metadata program
    /// via CPI. We pass it for address verification and CPI account mapping.
    #[account(mut)]
    pub metadata_account: UncheckedAccount<'info>,

    /// CHECK: Metaplex Token Metadata program
    pub token_metadata_program: UncheckedAccount<'info>,

    /// System program required by Metaplex
    pub system_program: Program<'info, System>,

    /// Rent sysvar (Metaplex accesses it internally)
    pub rent: Sysvar<'info, Rent>,
}

pub fn create_usdrw_metadata(
    ctx: Context<CreateUsdrwMetadata>,
    name: String,
    symbol: String,
    uri: String,
) -> Result<()> {
    // Restrict to protocol owner
    require!(
        ctx.accounts.protocol_config.owner == ctx.accounts.owner.key(),
        CdpError::InvalidProtocolAdmin
    );

    let mint = ctx.accounts.usdrw_mint.key();
    let (metadata_pda, _md_bump) = Metadata::find_pda(&mint);

    // Sanity check: provided metadata account matches PDA
    require!(
        ctx.accounts.metadata_account.key() == metadata_pda,
        CdpError::InvalidAccount
    );

    // Build DataV2
    let data = DataV2 {
        name,
        symbol,
        uri,
        seller_fee_basis_points: 0u16,
        creators: None,
        collection: None,
        uses: None,
    };

    // Create metadata instruction (V3)
    let create_ix = CreateMetadataAccountV3 {
        metadata: metadata_pda,
        mint,
        mint_authority: ctx.accounts.protocol_config.key(),
        payer: ctx.accounts.owner.key(),
        update_authority: (ctx.accounts.owner.key(), true),
        system_program: anchor_lang::solana_program::system_program::ID,
        rent: Some(anchor_lang::solana_program::sysvar::rent::ID),
    }
    .instruction(CreateMetadataAccountV3InstructionArgs {
        data,
        is_mutable: true,
        collection_details: None,
    });

    // Accounts for CPI
    let account_infos = vec![
        ctx.accounts.metadata_account.to_account_info(),
        ctx.accounts.usdrw_mint.to_account_info(),
        ctx.accounts.protocol_config.to_account_info(),
        ctx.accounts.owner.to_account_info(),
        ctx.accounts.owner.to_account_info(),
        ctx.accounts.system_program.to_account_info(),
        ctx.accounts.rent.to_account_info(),
    ];

    // Signer seeds for the protocol_config PDA
    let seeds: &[&[u8]] = &[b"protocol_config"];
    let bump = ctx.accounts.protocol_config.bump;
    let signer_seeds: &[&[&[u8]]] = &[&[seeds[0], &[bump]]];

    // Invoke Metaplex CPI
    invoke_signed(&create_ix, &account_infos, signer_seeds)
        .map_err(|_| error!(CdpError::CpiError))?;

    Ok(())
}