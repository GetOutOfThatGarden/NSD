import BN from "bn.js";
import {
  AnchorProvider,
  type IdlAccounts,
  Program,
  web3,
} from "@coral-xyz/anchor";
import { MethodsBuilder } from "@coral-xyz/anchor/dist/cjs/program/namespace/methods";
import type { BasaltCdpMvp } from "../../../target/types/basalt_cdp_mvp";
import idl from "../../../target/idl/basalt_cdp_mvp.json";
import * as pda from "./pda";



let _program: Program<BasaltCdpMvp>;


export const initializeClient = (
    programId: web3.PublicKey,
    anchorProvider = AnchorProvider.env(),
) => {
    _program = new Program<BasaltCdpMvp>(
        idl as BasaltCdpMvp,
        anchorProvider,
    );


};

export type InitializeProtocolArgs = {
  feePayer: web3.PublicKey;
  admin: web3.PublicKey;
  usdrwMint: web3.PublicKey;
  raydiumAmmId: web3.PublicKey;
  collateralMint: web3.PublicKey;
  interestRate: bigint;
  liquidationThreshold: bigint;
  maxCollateralRatio: bigint;
};

/**
 * ### Returns a {@link MethodsBuilder}
 * Initialize the protocol with configuration
 *
 * Accounts:
 * 0. `[writable, signer]` fee_payer: {@link PublicKey} 
 * 1. `[writable]` protocol_config: {@link ProtocolConfig} 
 * 2. `[signer]` admin: {@link PublicKey} Protocol administrator
 * 3. `[]` system_program: {@link PublicKey} Auto-generated, for account initialization
 *
 * Data:
 * - usdrw_mint: {@link PublicKey} USDRW token mint address
 * - raydium_amm_id: {@link PublicKey} Raydium AMM program ID
 * - collateral_mint: {@link PublicKey} Collateral token mint
 * - interest_rate: {@link BigInt} Annual interest rate (fixed point: 1e9 = 100%)
 * - liquidation_threshold: {@link BigInt} Liquidation threshold (fixed point: 1e9 = 100%)
 * - max_collateral_ratio: {@link BigInt} Maximum collateral ratio (fixed point: 1e9 = 100%)
 */
export const initializeProtocolBuilder = (
	args: InitializeProtocolArgs,
	remainingAccounts: Array<web3.AccountMeta> = [],
): MethodsBuilder<BasaltCdpMvp, never> => {
  const [protocolConfigPubkey] = pda.deriveProtocolConfigPDA(_program.programId);

  return _program
    .methods
    .initializeProtocol(
      args.usdrwMint,
      args.raydiumAmmId,
      args.collateralMint,
      new BN(args.interestRate.toString()),
      new BN(args.liquidationThreshold.toString()),
      new BN(args.maxCollateralRatio.toString()),
    )
    .accountsStrict({
      feePayer: args.feePayer,
      protocolConfig: protocolConfigPubkey,
      admin: args.admin,
      systemProgram: new web3.PublicKey("11111111111111111111111111111111"),
    })
    .remainingAccounts(remainingAccounts);
};

/**
 * ### Returns a {@link web3.TransactionInstruction}
 * Initialize the protocol with configuration
 *
 * Accounts:
 * 0. `[writable, signer]` fee_payer: {@link PublicKey} 
 * 1. `[writable]` protocol_config: {@link ProtocolConfig} 
 * 2. `[signer]` admin: {@link PublicKey} Protocol administrator
 * 3. `[]` system_program: {@link PublicKey} Auto-generated, for account initialization
 *
 * Data:
 * - usdrw_mint: {@link PublicKey} USDRW token mint address
 * - raydium_amm_id: {@link PublicKey} Raydium AMM program ID
 * - collateral_mint: {@link PublicKey} Collateral token mint
 * - interest_rate: {@link BigInt} Annual interest rate (fixed point: 1e9 = 100%)
 * - liquidation_threshold: {@link BigInt} Liquidation threshold (fixed point: 1e9 = 100%)
 * - max_collateral_ratio: {@link BigInt} Maximum collateral ratio (fixed point: 1e9 = 100%)
 */
export const initializeProtocol = (
	args: InitializeProtocolArgs,
	remainingAccounts: Array<web3.AccountMeta> = [],
): Promise<web3.TransactionInstruction> =>
    initializeProtocolBuilder(args, remainingAccounts).instruction();

/**
 * ### Returns a {@link web3.TransactionSignature}
 * Initialize the protocol with configuration
 *
 * Accounts:
 * 0. `[writable, signer]` fee_payer: {@link PublicKey} 
 * 1. `[writable]` protocol_config: {@link ProtocolConfig} 
 * 2. `[signer]` admin: {@link PublicKey} Protocol administrator
 * 3. `[]` system_program: {@link PublicKey} Auto-generated, for account initialization
 *
 * Data:
 * - usdrw_mint: {@link PublicKey} USDRW token mint address
 * - raydium_amm_id: {@link PublicKey} Raydium AMM program ID
 * - collateral_mint: {@link PublicKey} Collateral token mint
 * - interest_rate: {@link BigInt} Annual interest rate (fixed point: 1e9 = 100%)
 * - liquidation_threshold: {@link BigInt} Liquidation threshold (fixed point: 1e9 = 100%)
 * - max_collateral_ratio: {@link BigInt} Maximum collateral ratio (fixed point: 1e9 = 100%)
 */
export const initializeProtocolSendAndConfirm = async (
  args: Omit<InitializeProtocolArgs, "feePayer" | "admin"> & {
    signers: {
      feePayer: web3.Signer,
      admin: web3.Signer,
    },
  },
  remainingAccounts: Array<web3.AccountMeta> = [],
): Promise<web3.TransactionSignature> => {
  const preInstructions: Array<web3.TransactionInstruction> = [];


  return initializeProtocolBuilder({
      ...args,
      feePayer: args.signers.feePayer.publicKey,
      admin: args.signers.admin.publicKey,
    }, remainingAccounts)
    .preInstructions(preInstructions)
    .signers([args.signers.feePayer, args.signers.admin])
    .rpc();
}

export type MintUsdrwArgs = {
  feePayer: web3.PublicKey;
  user: web3.PublicKey;
  userCollateralAccount: web3.PublicKey;
  protocolCollateralAccount: web3.PublicKey;
  usdrwMint: web3.PublicKey;
  userUsdrwAccount: web3.PublicKey;
  mint: web3.PublicKey;
  owner: web3.PublicKey;
  wallet: web3.PublicKey;
  amount: bigint;
};

/**
 * ### Returns a {@link MethodsBuilder}
 * Mint USDRW tokens against collateral
 *
 * Accounts:
 * 0. `[writable, signer]` fee_payer: {@link PublicKey} 
 * 1. `[writable]` protocol_config: {@link ProtocolConfig} 
 * 2. `[writable]` user_vault: {@link UserVault} 
 * 3. `[signer]` user: {@link PublicKey} Vault owner
 * 4. `[writable]` user_collateral_account: {@link PublicKey} User's collateral token account
 * 5. `[writable]` protocol_collateral_account: {@link PublicKey} Protocol's collateral token account
 * 6. `[writable]` usdrw_mint: {@link Mint} USDRW token mint
 * 7. `[writable, signer]` user_usdrw_account: {@link PublicKey} User's USDRW token account
 * 8. `[]` system_program: {@link PublicKey} Auto-generated, for account initialization
 * 9. `[writable]` mint: {@link Mint} The mint.
 * 10. `[writable]` assoc_token_account: {@link Account} The account to mint tokens to.
 * 11. `[signer]` owner: {@link PublicKey} The mint's minting authority.
 * 12. `[]` wallet: {@link PublicKey} Wallet address for the new associated token account
 * 13. `[]` token_program: {@link PublicKey} SPL Token program
 * 14. `[]` token_program: {@link PublicKey} Auto-generated, TokenProgram
 *
 * Data:
 * - amount: {@link BigInt} Amount of USDRW to mint
 */
export const mintUsdrwBuilder = (
	args: MintUsdrwArgs,
	remainingAccounts: Array<web3.AccountMeta> = [],
): MethodsBuilder<BasaltCdpMvp, never> => {
  const [protocolConfigPubkey] = pda.deriveProtocolConfigPDA(_program.programId);
    const [userVaultPubkey] = pda.deriveUserVaultPDA({
        user: args.user,
    }, _program.programId);
    const [assocTokenAccountPubkey] = pda.CslSplTokenPDAs.deriveAccountPDA({
        wallet: args.wallet,
        tokenProgram: new web3.PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
        mint: args.mint,
    }, new web3.PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"));

  return _program
    .methods
    .mintUsdrw(
      new BN(args.amount.toString()),
    )
    .accountsStrict({
      feePayer: args.feePayer,
      protocolConfig: protocolConfigPubkey,
      userVault: userVaultPubkey,
      user: args.user,
      userCollateralAccount: args.userCollateralAccount,
      protocolCollateralAccount: args.protocolCollateralAccount,
      usdrwMint: args.usdrwMint,
      userUsdrwAccount: args.userUsdrwAccount,
      systemProgram: new web3.PublicKey("11111111111111111111111111111111"),
      mint: args.mint,
      assocTokenAccount: assocTokenAccountPubkey,
      owner: args.owner,
      wallet: args.wallet,
      tokenProgram: new web3.PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
      tokenProgram: new web3.PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
    })
    .remainingAccounts(remainingAccounts);
};

/**
 * ### Returns a {@link web3.TransactionInstruction}
 * Mint USDRW tokens against collateral
 *
 * Accounts:
 * 0. `[writable, signer]` fee_payer: {@link PublicKey} 
 * 1. `[writable]` protocol_config: {@link ProtocolConfig} 
 * 2. `[writable]` user_vault: {@link UserVault} 
 * 3. `[signer]` user: {@link PublicKey} Vault owner
 * 4. `[writable]` user_collateral_account: {@link PublicKey} User's collateral token account
 * 5. `[writable]` protocol_collateral_account: {@link PublicKey} Protocol's collateral token account
 * 6. `[writable]` usdrw_mint: {@link Mint} USDRW token mint
 * 7. `[writable, signer]` user_usdrw_account: {@link PublicKey} User's USDRW token account
 * 8. `[]` system_program: {@link PublicKey} Auto-generated, for account initialization
 * 9. `[writable]` mint: {@link Mint} The mint.
 * 10. `[writable]` assoc_token_account: {@link Account} The account to mint tokens to.
 * 11. `[signer]` owner: {@link PublicKey} The mint's minting authority.
 * 12. `[]` wallet: {@link PublicKey} Wallet address for the new associated token account
 * 13. `[]` token_program: {@link PublicKey} SPL Token program
 * 14. `[]` token_program: {@link PublicKey} Auto-generated, TokenProgram
 *
 * Data:
 * - amount: {@link BigInt} Amount of USDRW to mint
 */
export const mintUsdrw = (
	args: MintUsdrwArgs,
	remainingAccounts: Array<web3.AccountMeta> = [],
): Promise<web3.TransactionInstruction> =>
    mintUsdrwBuilder(args, remainingAccounts).instruction();

/**
 * ### Returns a {@link web3.TransactionSignature}
 * Mint USDRW tokens against collateral
 *
 * Accounts:
 * 0. `[writable, signer]` fee_payer: {@link PublicKey} 
 * 1. `[writable]` protocol_config: {@link ProtocolConfig} 
 * 2. `[writable]` user_vault: {@link UserVault} 
 * 3. `[signer]` user: {@link PublicKey} Vault owner
 * 4. `[writable]` user_collateral_account: {@link PublicKey} User's collateral token account
 * 5. `[writable]` protocol_collateral_account: {@link PublicKey} Protocol's collateral token account
 * 6. `[writable]` usdrw_mint: {@link Mint} USDRW token mint
 * 7. `[writable, signer]` user_usdrw_account: {@link PublicKey} User's USDRW token account
 * 8. `[]` system_program: {@link PublicKey} Auto-generated, for account initialization
 * 9. `[writable]` mint: {@link Mint} The mint.
 * 10. `[writable]` assoc_token_account: {@link Account} The account to mint tokens to.
 * 11. `[signer]` owner: {@link PublicKey} The mint's minting authority.
 * 12. `[]` wallet: {@link PublicKey} Wallet address for the new associated token account
 * 13. `[]` token_program: {@link PublicKey} SPL Token program
 * 14. `[]` token_program: {@link PublicKey} Auto-generated, TokenProgram
 *
 * Data:
 * - amount: {@link BigInt} Amount of USDRW to mint
 */
export const mintUsdrwSendAndConfirm = async (
  args: Omit<MintUsdrwArgs, "feePayer" | "user" | "userUsdrwAccount" | "owner"> & {
    signers: {
      feePayer: web3.Signer,
      user: web3.Signer,
      userUsdrwAccount: web3.Signer,
      owner: web3.Signer,
    },
  },
  remainingAccounts: Array<web3.AccountMeta> = [],
): Promise<web3.TransactionSignature> => {
  const preInstructions: Array<web3.TransactionInstruction> = [];


  return mintUsdrwBuilder({
      ...args,
      feePayer: args.signers.feePayer.publicKey,
      user: args.signers.user.publicKey,
      userUsdrwAccount: args.signers.userUsdrwAccount.publicKey,
      owner: args.signers.owner.publicKey,
    }, remainingAccounts)
    .preInstructions(preInstructions)
    .signers([args.signers.feePayer, args.signers.user, args.signers.userUsdrwAccount, args.signers.owner])
    .rpc();
}

export type RedeemCollateralArgs = {
  feePayer: web3.PublicKey;
  user: web3.PublicKey;
  userUsdrwAccount: web3.PublicKey;
  protocolUsdrwAccount: web3.PublicKey;
  userCollateralAccount: web3.PublicKey;
  protocolCollateralAccount: web3.PublicKey;
  mint: web3.PublicKey;
  owner: web3.PublicKey;
  wallet: web3.PublicKey;
  source: web3.PublicKey;
  destination: web3.PublicKey;
  authority: web3.PublicKey;
  amount: bigint;
};

/**
 * ### Returns a {@link MethodsBuilder}
 * Redeem collateral tokens by repaying debt
 *
 * Accounts:
 * 0. `[writable, signer]` fee_payer: {@link PublicKey} 
 * 1. `[writable]` protocol_config: {@link ProtocolConfig} 
 * 2. `[writable]` user_vault: {@link UserVault} 
 * 3. `[signer]` user: {@link PublicKey} Vault owner
 * 4. `[writable]` user_usdrw_account: {@link PublicKey} User's USDRW token account
 * 5. `[writable]` protocol_usdrw_account: {@link PublicKey} Protocol's USDRW token account
 * 6. `[writable]` user_collateral_account: {@link PublicKey} User's collateral token account
 * 7. `[writable]` protocol_collateral_account: {@link PublicKey} Protocol's collateral token account
 * 8. `[writable]` account: {@link Account} The account to burn from.
 * 9. `[writable]` mint: {@link Mint} The token mint.
 * 10. `[signer]` owner: {@link PublicKey} The account's owner/delegate.
 * 11. `[]` wallet: {@link PublicKey} Wallet address for the new associated token account
 * 12. `[]` token_program: {@link PublicKey} SPL Token program
 * 13. `[writable]` source: {@link PublicKey} The source account.
 * 14. `[writable]` destination: {@link PublicKey} The destination account.
 * 15. `[signer]` authority: {@link PublicKey} The source account's owner/delegate.
 * 16. `[]` token_program: {@link PublicKey} Auto-generated, TokenProgram
 *
 * Data:
 * - amount: {@link BigInt} Amount of USDRW to redeem
 */
export const redeemCollateralBuilder = (
	args: RedeemCollateralArgs,
	remainingAccounts: Array<web3.AccountMeta> = [],
): MethodsBuilder<BasaltCdpMvp, never> => {
  const [protocolConfigPubkey] = pda.deriveProtocolConfigPDA(_program.programId);
    const [userVaultPubkey] = pda.deriveUserVaultPDA({
        user: args.user,
    }, _program.programId);
    const [accountPubkey] = pda.CslSplTokenPDAs.deriveAccountPDA({
        wallet: args.wallet,
        tokenProgram: new web3.PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
        mint: args.mint,
    }, new web3.PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"));

  return _program
    .methods
    .redeemCollateral(
      new BN(args.amount.toString()),
    )
    .accountsStrict({
      feePayer: args.feePayer,
      protocolConfig: protocolConfigPubkey,
      userVault: userVaultPubkey,
      user: args.user,
      userUsdrwAccount: args.userUsdrwAccount,
      protocolUsdrwAccount: args.protocolUsdrwAccount,
      userCollateralAccount: args.userCollateralAccount,
      protocolCollateralAccount: args.protocolCollateralAccount,
      account: accountPubkey,
      mint: args.mint,
      owner: args.owner,
      wallet: args.wallet,
      tokenProgram: new web3.PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
      source: args.source,
      destination: args.destination,
      authority: args.authority,
      tokenProgram: new web3.PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
    })
    .remainingAccounts(remainingAccounts);
};

/**
 * ### Returns a {@link web3.TransactionInstruction}
 * Redeem collateral tokens by repaying debt
 *
 * Accounts:
 * 0. `[writable, signer]` fee_payer: {@link PublicKey} 
 * 1. `[writable]` protocol_config: {@link ProtocolConfig} 
 * 2. `[writable]` user_vault: {@link UserVault} 
 * 3. `[signer]` user: {@link PublicKey} Vault owner
 * 4. `[writable]` user_usdrw_account: {@link PublicKey} User's USDRW token account
 * 5. `[writable]` protocol_usdrw_account: {@link PublicKey} Protocol's USDRW token account
 * 6. `[writable]` user_collateral_account: {@link PublicKey} User's collateral token account
 * 7. `[writable]` protocol_collateral_account: {@link PublicKey} Protocol's collateral token account
 * 8. `[writable]` account: {@link Account} The account to burn from.
 * 9. `[writable]` mint: {@link Mint} The token mint.
 * 10. `[signer]` owner: {@link PublicKey} The account's owner/delegate.
 * 11. `[]` wallet: {@link PublicKey} Wallet address for the new associated token account
 * 12. `[]` token_program: {@link PublicKey} SPL Token program
 * 13. `[writable]` source: {@link PublicKey} The source account.
 * 14. `[writable]` destination: {@link PublicKey} The destination account.
 * 15. `[signer]` authority: {@link PublicKey} The source account's owner/delegate.
 * 16. `[]` token_program: {@link PublicKey} Auto-generated, TokenProgram
 *
 * Data:
 * - amount: {@link BigInt} Amount of USDRW to redeem
 */
export const redeemCollateral = (
	args: RedeemCollateralArgs,
	remainingAccounts: Array<web3.AccountMeta> = [],
): Promise<web3.TransactionInstruction> =>
    redeemCollateralBuilder(args, remainingAccounts).instruction();

/**
 * ### Returns a {@link web3.TransactionSignature}
 * Redeem collateral tokens by repaying debt
 *
 * Accounts:
 * 0. `[writable, signer]` fee_payer: {@link PublicKey} 
 * 1. `[writable]` protocol_config: {@link ProtocolConfig} 
 * 2. `[writable]` user_vault: {@link UserVault} 
 * 3. `[signer]` user: {@link PublicKey} Vault owner
 * 4. `[writable]` user_usdrw_account: {@link PublicKey} User's USDRW token account
 * 5. `[writable]` protocol_usdrw_account: {@link PublicKey} Protocol's USDRW token account
 * 6. `[writable]` user_collateral_account: {@link PublicKey} User's collateral token account
 * 7. `[writable]` protocol_collateral_account: {@link PublicKey} Protocol's collateral token account
 * 8. `[writable]` account: {@link Account} The account to burn from.
 * 9. `[writable]` mint: {@link Mint} The token mint.
 * 10. `[signer]` owner: {@link PublicKey} The account's owner/delegate.
 * 11. `[]` wallet: {@link PublicKey} Wallet address for the new associated token account
 * 12. `[]` token_program: {@link PublicKey} SPL Token program
 * 13. `[writable]` source: {@link PublicKey} The source account.
 * 14. `[writable]` destination: {@link PublicKey} The destination account.
 * 15. `[signer]` authority: {@link PublicKey} The source account's owner/delegate.
 * 16. `[]` token_program: {@link PublicKey} Auto-generated, TokenProgram
 *
 * Data:
 * - amount: {@link BigInt} Amount of USDRW to redeem
 */
export const redeemCollateralSendAndConfirm = async (
  args: Omit<RedeemCollateralArgs, "feePayer" | "user" | "owner" | "authority"> & {
    signers: {
      feePayer: web3.Signer,
      user: web3.Signer,
      owner: web3.Signer,
      authority: web3.Signer,
    },
  },
  remainingAccounts: Array<web3.AccountMeta> = [],
): Promise<web3.TransactionSignature> => {
  const preInstructions: Array<web3.TransactionInstruction> = [];


  return redeemCollateralBuilder({
      ...args,
      feePayer: args.signers.feePayer.publicKey,
      user: args.signers.user.publicKey,
      owner: args.signers.owner.publicKey,
      authority: args.signers.authority.publicKey,
    }, remainingAccounts)
    .preInstructions(preInstructions)
    .signers([args.signers.feePayer, args.signers.user, args.signers.owner, args.signers.authority])
    .rpc();
}

export type LiquidateVaultArgs = {
  feePayer: web3.PublicKey;
  liquidator: web3.PublicKey;
  userUsdrwAccount: web3.PublicKey;
  protocolUsdrwAccount: web3.PublicKey;
  userCollateralAccount: web3.PublicKey;
  protocolCollateralAccount: web3.PublicKey;
  source: web3.PublicKey;
  mint: web3.PublicKey;
  destination: web3.PublicKey;
  authority: web3.PublicKey;
  owner: web3.PublicKey;
  wallet: web3.PublicKey;
  liquidatedUser: web3.PublicKey;
  amount: bigint;
};

/**
 * ### Returns a {@link MethodsBuilder}
 * Liquidate undercollateralized vaults
 *
 * Accounts:
 * 0. `[writable, signer]` fee_payer: {@link PublicKey} 
 * 1. `[writable]` protocol_config: {@link ProtocolConfig} 
 * 2. `[writable]` user_vault: {@link UserVault} 
 * 3. `[signer]` liquidator: {@link PublicKey} Liquidator account
 * 4. `[writable]` user_usdrw_account: {@link PublicKey} User's USDRW token account
 * 5. `[writable]` protocol_usdrw_account: {@link PublicKey} Protocol's USDRW token account
 * 6. `[writable]` user_collateral_account: {@link PublicKey} User's collateral token account
 * 7. `[writable]` protocol_collateral_account: {@link PublicKey} Protocol's collateral token account
 * 8. `[writable]` source: {@link PublicKey} The source account.
 * 9. `[writable]` mint: {@link Mint} The token mint.
 * 10. `[writable]` destination: {@link PublicKey} The destination account.
 * 11. `[signer]` authority: {@link PublicKey} The source account's owner/delegate.
 * 12. `[writable]` account: {@link Account} The account to burn from.
 * 13. `[signer]` owner: {@link PublicKey} The account's owner/delegate.
 * 14. `[]` wallet: {@link PublicKey} Wallet address for the new associated token account
 * 15. `[]` token_program: {@link PublicKey} SPL Token program
 * 16. `[]` token_program: {@link PublicKey} Auto-generated, TokenProgram
 *
 * Data:
 * - liquidated_user: {@link PublicKey} User whose vault is being liquidated
 * - amount: {@link BigInt} Amount of USDRW to liquidate
 */
export const liquidateVaultBuilder = (
	args: LiquidateVaultArgs,
	remainingAccounts: Array<web3.AccountMeta> = [],
): MethodsBuilder<BasaltCdpMvp, never> => {
  const [protocolConfigPubkey] = pda.deriveProtocolConfigPDA(_program.programId);
    const [userVaultPubkey] = pda.deriveUserVaultPDA({
        user: args.liquidatedUser,
    }, _program.programId);
    const [accountPubkey] = pda.CslSplTokenPDAs.deriveAccountPDA({
        wallet: args.wallet,
        tokenProgram: new web3.PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
        mint: args.mint,
    }, new web3.PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"));

  return _program
    .methods
    .liquidateVault(
      args.liquidatedUser,
      new BN(args.amount.toString()),
    )
    .accountsStrict({
      feePayer: args.feePayer,
      protocolConfig: protocolConfigPubkey,
      userVault: userVaultPubkey,
      liquidator: args.liquidator,
      userUsdrwAccount: args.userUsdrwAccount,
      protocolUsdrwAccount: args.protocolUsdrwAccount,
      userCollateralAccount: args.userCollateralAccount,
      protocolCollateralAccount: args.protocolCollateralAccount,
      source: args.source,
      mint: args.mint,
      destination: args.destination,
      authority: args.authority,
      account: accountPubkey,
      owner: args.owner,
      wallet: args.wallet,
      tokenProgram: new web3.PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
      tokenProgram: new web3.PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
    })
    .remainingAccounts(remainingAccounts);
};

/**
 * ### Returns a {@link web3.TransactionInstruction}
 * Liquidate undercollateralized vaults
 *
 * Accounts:
 * 0. `[writable, signer]` fee_payer: {@link PublicKey} 
 * 1. `[writable]` protocol_config: {@link ProtocolConfig} 
 * 2. `[writable]` user_vault: {@link UserVault} 
 * 3. `[signer]` liquidator: {@link PublicKey} Liquidator account
 * 4. `[writable]` user_usdrw_account: {@link PublicKey} User's USDRW token account
 * 5. `[writable]` protocol_usdrw_account: {@link PublicKey} Protocol's USDRW token account
 * 6. `[writable]` user_collateral_account: {@link PublicKey} User's collateral token account
 * 7. `[writable]` protocol_collateral_account: {@link PublicKey} Protocol's collateral token account
 * 8. `[writable]` source: {@link PublicKey} The source account.
 * 9. `[writable]` mint: {@link Mint} The token mint.
 * 10. `[writable]` destination: {@link PublicKey} The destination account.
 * 11. `[signer]` authority: {@link PublicKey} The source account's owner/delegate.
 * 12. `[writable]` account: {@link Account} The account to burn from.
 * 13. `[signer]` owner: {@link PublicKey} The account's owner/delegate.
 * 14. `[]` wallet: {@link PublicKey} Wallet address for the new associated token account
 * 15. `[]` token_program: {@link PublicKey} SPL Token program
 * 16. `[]` token_program: {@link PublicKey} Auto-generated, TokenProgram
 *
 * Data:
 * - liquidated_user: {@link PublicKey} User whose vault is being liquidated
 * - amount: {@link BigInt} Amount of USDRW to liquidate
 */
export const liquidateVault = (
	args: LiquidateVaultArgs,
	remainingAccounts: Array<web3.AccountMeta> = [],
): Promise<web3.TransactionInstruction> =>
    liquidateVaultBuilder(args, remainingAccounts).instruction();

/**
 * ### Returns a {@link web3.TransactionSignature}
 * Liquidate undercollateralized vaults
 *
 * Accounts:
 * 0. `[writable, signer]` fee_payer: {@link PublicKey} 
 * 1. `[writable]` protocol_config: {@link ProtocolConfig} 
 * 2. `[writable]` user_vault: {@link UserVault} 
 * 3. `[signer]` liquidator: {@link PublicKey} Liquidator account
 * 4. `[writable]` user_usdrw_account: {@link PublicKey} User's USDRW token account
 * 5. `[writable]` protocol_usdrw_account: {@link PublicKey} Protocol's USDRW token account
 * 6. `[writable]` user_collateral_account: {@link PublicKey} User's collateral token account
 * 7. `[writable]` protocol_collateral_account: {@link PublicKey} Protocol's collateral token account
 * 8. `[writable]` source: {@link PublicKey} The source account.
 * 9. `[writable]` mint: {@link Mint} The token mint.
 * 10. `[writable]` destination: {@link PublicKey} The destination account.
 * 11. `[signer]` authority: {@link PublicKey} The source account's owner/delegate.
 * 12. `[writable]` account: {@link Account} The account to burn from.
 * 13. `[signer]` owner: {@link PublicKey} The account's owner/delegate.
 * 14. `[]` wallet: {@link PublicKey} Wallet address for the new associated token account
 * 15. `[]` token_program: {@link PublicKey} SPL Token program
 * 16. `[]` token_program: {@link PublicKey} Auto-generated, TokenProgram
 *
 * Data:
 * - liquidated_user: {@link PublicKey} User whose vault is being liquidated
 * - amount: {@link BigInt} Amount of USDRW to liquidate
 */
export const liquidateVaultSendAndConfirm = async (
  args: Omit<LiquidateVaultArgs, "feePayer" | "liquidator" | "authority" | "owner"> & {
    signers: {
      feePayer: web3.Signer,
      liquidator: web3.Signer,
      authority: web3.Signer,
      owner: web3.Signer,
    },
  },
  remainingAccounts: Array<web3.AccountMeta> = [],
): Promise<web3.TransactionSignature> => {
  const preInstructions: Array<web3.TransactionInstruction> = [];


  return liquidateVaultBuilder({
      ...args,
      feePayer: args.signers.feePayer.publicKey,
      liquidator: args.signers.liquidator.publicKey,
      authority: args.signers.authority.publicKey,
      owner: args.signers.owner.publicKey,
    }, remainingAccounts)
    .preInstructions(preInstructions)
    .signers([args.signers.feePayer, args.signers.liquidator, args.signers.authority, args.signers.owner])
    .rpc();
}

export type CalculateInterestArgs = {
  feePayer: web3.PublicKey;
  user: web3.PublicKey;
};

/**
 * ### Returns a {@link MethodsBuilder}
 * Calculate and accrue interest on vaults
 *
 * Accounts:
 * 0. `[writable, signer]` fee_payer: {@link PublicKey} 
 * 1. `[writable]` protocol_config: {@link ProtocolConfig} 
 * 2. `[writable]` user_vault: {@link UserVault} 
 *
 * Data:
 * - user: {@link PublicKey} Vault owner
 */
export const calculateInterestBuilder = (
	args: CalculateInterestArgs,
	remainingAccounts: Array<web3.AccountMeta> = [],
): MethodsBuilder<BasaltCdpMvp, never> => {
  const [protocolConfigPubkey] = pda.deriveProtocolConfigPDA(_program.programId);
    const [userVaultPubkey] = pda.deriveUserVaultPDA({
        user: args.user,
    }, _program.programId);

  return _program
    .methods
    .calculateInterest(
      args.user,
    )
    .accountsStrict({
      feePayer: args.feePayer,
      protocolConfig: protocolConfigPubkey,
      userVault: userVaultPubkey,
    })
    .remainingAccounts(remainingAccounts);
};

/**
 * ### Returns a {@link web3.TransactionInstruction}
 * Calculate and accrue interest on vaults
 *
 * Accounts:
 * 0. `[writable, signer]` fee_payer: {@link PublicKey} 
 * 1. `[writable]` protocol_config: {@link ProtocolConfig} 
 * 2. `[writable]` user_vault: {@link UserVault} 
 *
 * Data:
 * - user: {@link PublicKey} Vault owner
 */
export const calculateInterest = (
	args: CalculateInterestArgs,
	remainingAccounts: Array<web3.AccountMeta> = [],
): Promise<web3.TransactionInstruction> =>
    calculateInterestBuilder(args, remainingAccounts).instruction();

/**
 * ### Returns a {@link web3.TransactionSignature}
 * Calculate and accrue interest on vaults
 *
 * Accounts:
 * 0. `[writable, signer]` fee_payer: {@link PublicKey} 
 * 1. `[writable]` protocol_config: {@link ProtocolConfig} 
 * 2. `[writable]` user_vault: {@link UserVault} 
 *
 * Data:
 * - user: {@link PublicKey} Vault owner
 */
export const calculateInterestSendAndConfirm = async (
  args: Omit<CalculateInterestArgs, "feePayer"> & {
    signers: {
      feePayer: web3.Signer,
    },
  },
  remainingAccounts: Array<web3.AccountMeta> = [],
): Promise<web3.TransactionSignature> => {
  const preInstructions: Array<web3.TransactionInstruction> = [];


  return calculateInterestBuilder({
      ...args,
      feePayer: args.signers.feePayer.publicKey,
    }, remainingAccounts)
    .preInstructions(preInstructions)
    .signers([args.signers.feePayer])
    .rpc();
}

// Getters

export const getProtocolConfig = (
    publicKey: web3.PublicKey,
    commitment?: web3.Commitment
): Promise<IdlAccounts<BasaltCdpMvp>["protocolConfig"]> => _program.account.protocolConfig.fetch(publicKey, commitment);

export const getUserVault = (
    publicKey: web3.PublicKey,
    commitment?: web3.Commitment
): Promise<IdlAccounts<BasaltCdpMvp>["userVault"]> => _program.account.userVault.fetch(publicKey, commitment);
