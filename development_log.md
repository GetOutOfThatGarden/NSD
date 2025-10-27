# Development Log

## 2025-10-27 11:08
- Task: Add instruction to initialize protocol collateral vault PDA token account and wire client call.
- Description: Implemented `initialize_collateral_vault` Anchor instruction to create a `TokenAccount` at `seeds = [b"collateral_vault", protocol_config]` with `protocol_config` as authority and `collateral_mint` as mint. Wired into program entrypoint and modules. Updated devnet script to call this instruction after protocol initialization, before minting.
- Code Changes:
  - Added `programs/basalt_cdp_mvp/src/instructions/initialize_collateral_vault.rs` with account constraints: `init`, `payer = owner`, `token::mint = collateral_mint`, `token::authority = protocol_config`.
  - Updated `programs/basalt_cdp_mvp/src/instructions/mod.rs` to export the new instruction.
  - Updated `programs/basalt_cdp_mvp/src/lib.rs` to expose `initialize_collateral_vault` in the `#[program]` module.
  - Modified `scripts/test-devnet.ts` to call `program.methods.initializeCollateralVault()` after protocol init; fixed BN import usage in mint step.
- Issues/Challenges: Ensuring proper authority and seeds for the PDA token account; front-end currently uses manual instruction builders with fixed discriminators which won’t include the new instruction.
- Solutions:
  - Enforced owner check using `CdpError::InvalidProtocolAdmin` to restrict initialization to protocol owner.
  - Used Anchor `token::` constraints to create the PDA token account cleanly.
  - Updated devnet script to validate and create the vault before minting.
- Next Steps:
  - Optionally add a frontend instruction builder for `initialize_collateral_vault` (compute discriminator via Anchor hash) or call via Anchor client.
  - Run `anchor build` and basic integration tests to confirm end-to-end behavior.

## 2025-10-27 10:45 (local)
- Task: Determine whether the program creates an associated token account (ATA) for the SPYx CDP.
- Summary: Reviewed on-chain instructions (`initialize_protocol.rs`, `mint_usdrw.rs`, `redeem_collateral.rs`, `liquidate_vault.rs`) and client scripts (`scripts/test-devnet.ts`).
- Findings:
  - On-chain program does not create ATAs; it requires pre-existing `TokenAccount`s.
  - `mint_usdrw` and `redeem_collateral` import `AssociatedToken` but do not use `associated_token` constraints.
  - Client script creates user ATAs via `getOrCreateAssociatedTokenAccount`.
  - Protocol collateral vault uses a custom PDA (`collateral_vault`) and is not initialized on-chain.
- Issues/Challenges:
  - Potential runtime failures if `protocol_collateral_account` doesn’t exist (no `init` on-chain).
  - Confusion between custom PDA vault and ATA derivation.
- Solutions/Recommendations:
  - Optionally add `associated_token` constraints to auto-create the user’s USDRW ATA in `mint_usdrw`.
  - Add an instruction to initialize the `collateral_vault` PDA token account, or switch to a protocol ATA (with `allowOwnerOffCurve = true`) and update code to expect the ATA.
- Code Changes: None applied in this step; provided guidance only.