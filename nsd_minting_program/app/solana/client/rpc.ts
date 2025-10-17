import BN from "bn.js";
import {
  AnchorProvider,
  type IdlAccounts,
  Program,
  web3,
} from "@coral-xyz/anchor";
import { MethodsBuilder } from "@coral-xyz/anchor/dist/cjs/program/namespace/methods";
import type { NsdMinting } from "../../../target/types/nsd_minting";
import idl from "../../../target/idl/nsd_minting.json";
import * as pda from "./pda";



let _program: Program<NsdMinting>;


export const initializeClient = (
    programId: web3.PublicKey,
    anchorProvider = AnchorProvider.env(),
) => {
    _program = new Program<NsdMinting>(
        idl as NsdMinting,
        anchorProvider,
    );


};

export type InitializeConfigArgs = {
  feePayer: web3.PublicKey;
  admin: web3.PublicKey;
  tokenMint: web3.PublicKey;
  maxSupply: bigint;
  mintPrice: bigint;
};

/**
 * ### Returns a {@link MethodsBuilder}
 * Initialize the NSD minting configuration
 *
 * Accounts:
 * 0. `[writable, signer]` fee_payer: {@link PublicKey} 
 * 1. `[writable]` config: {@link NsdConfig} 
 * 2. `[signer]` admin: {@link PublicKey} Admin authority account
 * 3. `[]` system_program: {@link PublicKey} Auto-generated, for account initialization
 *
 * Data:
 * - token_mint: {@link PublicKey} Mint address for NSD token
 * - max_supply: {@link BigInt} Maximum supply of NSD tokens
 * - mint_price: {@link BigInt} Price per NSD token in lamports
 */
export const initializeConfigBuilder = (
	args: InitializeConfigArgs,
	remainingAccounts: Array<web3.AccountMeta> = [],
): MethodsBuilder<NsdMinting, never> => {
  const [configPubkey] = pda.deriveNsdConfigPDA(_program.programId);

  return _program
    .methods
    .initializeConfig(
      args.tokenMint,
      new BN(args.maxSupply.toString()),
      new BN(args.mintPrice.toString()),
    )
    .accountsStrict({
      feePayer: args.feePayer,
      config: configPubkey,
      admin: args.admin,
      systemProgram: new web3.PublicKey("11111111111111111111111111111111"),
    })
    .remainingAccounts(remainingAccounts);
};

/**
 * ### Returns a {@link web3.TransactionInstruction}
 * Initialize the NSD minting configuration
 *
 * Accounts:
 * 0. `[writable, signer]` fee_payer: {@link PublicKey} 
 * 1. `[writable]` config: {@link NsdConfig} 
 * 2. `[signer]` admin: {@link PublicKey} Admin authority account
 * 3. `[]` system_program: {@link PublicKey} Auto-generated, for account initialization
 *
 * Data:
 * - token_mint: {@link PublicKey} Mint address for NSD token
 * - max_supply: {@link BigInt} Maximum supply of NSD tokens
 * - mint_price: {@link BigInt} Price per NSD token in lamports
 */
export const initializeConfig = (
	args: InitializeConfigArgs,
	remainingAccounts: Array<web3.AccountMeta> = [],
): Promise<web3.TransactionInstruction> =>
    initializeConfigBuilder(args, remainingAccounts).instruction();

/**
 * ### Returns a {@link web3.TransactionSignature}
 * Initialize the NSD minting configuration
 *
 * Accounts:
 * 0. `[writable, signer]` fee_payer: {@link PublicKey} 
 * 1. `[writable]` config: {@link NsdConfig} 
 * 2. `[signer]` admin: {@link PublicKey} Admin authority account
 * 3. `[]` system_program: {@link PublicKey} Auto-generated, for account initialization
 *
 * Data:
 * - token_mint: {@link PublicKey} Mint address for NSD token
 * - max_supply: {@link BigInt} Maximum supply of NSD tokens
 * - mint_price: {@link BigInt} Price per NSD token in lamports
 */
export const initializeConfigSendAndConfirm = async (
  args: Omit<InitializeConfigArgs, "feePayer" | "admin"> & {
    signers: {
      feePayer: web3.Signer,
      admin: web3.Signer,
    },
  },
  remainingAccounts: Array<web3.AccountMeta> = [],
): Promise<web3.TransactionSignature> => {
  const preInstructions: Array<web3.TransactionInstruction> = [];


  return initializeConfigBuilder({
      ...args,
      feePayer: args.signers.feePayer.publicKey,
      admin: args.signers.admin.publicKey,
    }, remainingAccounts)
    .preInstructions(preInstructions)
    .signers([args.signers.feePayer, args.signers.admin])
    .rpc();
}

export type MintTokensArgs = {
  feePayer: web3.PublicKey;
  userTokenAccount: web3.PublicKey;
  user: web3.PublicKey;
  tokenMint: web3.PublicKey;
  mint: web3.PublicKey;
  owner: web3.PublicKey;
  wallet: web3.PublicKey;
  mintAmount: bigint;
};

/**
 * ### Returns a {@link MethodsBuilder}
 * Mint NSD tokens for a user
 *
 * Accounts:
 * 0. `[writable, signer]` fee_payer: {@link PublicKey} 
 * 1. `[writable]` config: {@link NsdConfig} 
 * 2. `[writable]` user_token_account: {@link PublicKey} User's token account
 * 3. `[signer]` user: {@link PublicKey} User's wallet address
 * 4. `[writable]` user_account: {@link NsdUser} 
 * 5. `[]` token_mint: {@link Mint} NSD token mint account
 * 6. `[]` system_program: {@link PublicKey} Auto-generated, for account initialization
 * 7. `[writable]` mint: {@link Mint} The mint.
 * 8. `[writable]` assoc_token_account: {@link Account} The account to mint tokens to.
 * 9. `[signer]` owner: {@link PublicKey} The mint's minting authority.
 * 10. `[]` wallet: {@link PublicKey} Wallet address for the new associated token account
 * 11. `[]` token_program: {@link PublicKey} SPL Token program
 * 12. `[]` token_program: {@link PublicKey} Auto-generated, TokenProgram
 *
 * Data:
 * - mint_amount: {@link BigInt} Number of tokens to mint
 */
export const mintTokensBuilder = (
	args: MintTokensArgs,
	remainingAccounts: Array<web3.AccountMeta> = [],
): MethodsBuilder<NsdMinting, never> => {
  const [configPubkey] = pda.deriveNsdConfigPDA(_program.programId);
    const [userAccountPubkey] = pda.deriveNsdUserPDA({
        user: args.user,
    }, _program.programId);
    const [assocTokenAccountPubkey] = pda.CslSplTokenPDAs.deriveAccountPDA({
        wallet: args.wallet,
        tokenProgram: new web3.PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
        mint: args.mint,
    }, new web3.PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"));

  return _program
    .methods
    .mintTokens(
      new BN(args.mintAmount.toString()),
    )
    .accountsStrict({
      feePayer: args.feePayer,
      config: configPubkey,
      userTokenAccount: args.userTokenAccount,
      user: args.user,
      userAccount: userAccountPubkey,
      tokenMint: args.tokenMint,
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
 * Mint NSD tokens for a user
 *
 * Accounts:
 * 0. `[writable, signer]` fee_payer: {@link PublicKey} 
 * 1. `[writable]` config: {@link NsdConfig} 
 * 2. `[writable]` user_token_account: {@link PublicKey} User's token account
 * 3. `[signer]` user: {@link PublicKey} User's wallet address
 * 4. `[writable]` user_account: {@link NsdUser} 
 * 5. `[]` token_mint: {@link Mint} NSD token mint account
 * 6. `[]` system_program: {@link PublicKey} Auto-generated, for account initialization
 * 7. `[writable]` mint: {@link Mint} The mint.
 * 8. `[writable]` assoc_token_account: {@link Account} The account to mint tokens to.
 * 9. `[signer]` owner: {@link PublicKey} The mint's minting authority.
 * 10. `[]` wallet: {@link PublicKey} Wallet address for the new associated token account
 * 11. `[]` token_program: {@link PublicKey} SPL Token program
 * 12. `[]` token_program: {@link PublicKey} Auto-generated, TokenProgram
 *
 * Data:
 * - mint_amount: {@link BigInt} Number of tokens to mint
 */
export const mintTokens = (
	args: MintTokensArgs,
	remainingAccounts: Array<web3.AccountMeta> = [],
): Promise<web3.TransactionInstruction> =>
    mintTokensBuilder(args, remainingAccounts).instruction();

/**
 * ### Returns a {@link web3.TransactionSignature}
 * Mint NSD tokens for a user
 *
 * Accounts:
 * 0. `[writable, signer]` fee_payer: {@link PublicKey} 
 * 1. `[writable]` config: {@link NsdConfig} 
 * 2. `[writable]` user_token_account: {@link PublicKey} User's token account
 * 3. `[signer]` user: {@link PublicKey} User's wallet address
 * 4. `[writable]` user_account: {@link NsdUser} 
 * 5. `[]` token_mint: {@link Mint} NSD token mint account
 * 6. `[]` system_program: {@link PublicKey} Auto-generated, for account initialization
 * 7. `[writable]` mint: {@link Mint} The mint.
 * 8. `[writable]` assoc_token_account: {@link Account} The account to mint tokens to.
 * 9. `[signer]` owner: {@link PublicKey} The mint's minting authority.
 * 10. `[]` wallet: {@link PublicKey} Wallet address for the new associated token account
 * 11. `[]` token_program: {@link PublicKey} SPL Token program
 * 12. `[]` token_program: {@link PublicKey} Auto-generated, TokenProgram
 *
 * Data:
 * - mint_amount: {@link BigInt} Number of tokens to mint
 */
export const mintTokensSendAndConfirm = async (
  args: Omit<MintTokensArgs, "feePayer" | "user" | "owner"> & {
    signers: {
      feePayer: web3.Signer,
      user: web3.Signer,
      owner: web3.Signer,
    },
  },
  remainingAccounts: Array<web3.AccountMeta> = [],
): Promise<web3.TransactionSignature> => {
  const preInstructions: Array<web3.TransactionInstruction> = [];


  return mintTokensBuilder({
      ...args,
      feePayer: args.signers.feePayer.publicKey,
      user: args.signers.user.publicKey,
      owner: args.signers.owner.publicKey,
    }, remainingAccounts)
    .preInstructions(preInstructions)
    .signers([args.signers.feePayer, args.signers.user, args.signers.owner])
    .rpc();
}

export type UpdateConfigArgs = {
  feePayer: web3.PublicKey;
  admin: web3.PublicKey;
  maxSupply: bigint | undefined;
  mintPrice: bigint | undefined;
  isActive: boolean | undefined;
};

/**
 * ### Returns a {@link MethodsBuilder}
 * Update NSD minting configuration
 *
 * Accounts:
 * 0. `[writable, signer]` fee_payer: {@link PublicKey} 
 * 1. `[writable]` config: {@link NsdConfig} 
 * 2. `[signer]` admin: {@link PublicKey} Admin authority account
 *
 * Data:
 * - max_supply: {@link BigInt | undefined} New maximum supply
 * - mint_price: {@link BigInt | undefined} New mint price
 * - is_active: {@link boolean | undefined} New active status
 */
export const updateConfigBuilder = (
	args: UpdateConfigArgs,
	remainingAccounts: Array<web3.AccountMeta> = [],
): MethodsBuilder<NsdMinting, never> => {
  const [configPubkey] = pda.deriveNsdConfigPDA(_program.programId);

  return _program
    .methods
    .updateConfig(
      args.maxSupply ? new BN(args.maxSupply.toString()) : undefined,
      args.mintPrice ? new BN(args.mintPrice.toString()) : undefined,
      args.isActive,
    )
    .accountsStrict({
      feePayer: args.feePayer,
      config: configPubkey,
      admin: args.admin,
    })
    .remainingAccounts(remainingAccounts);
};

/**
 * ### Returns a {@link web3.TransactionInstruction}
 * Update NSD minting configuration
 *
 * Accounts:
 * 0. `[writable, signer]` fee_payer: {@link PublicKey} 
 * 1. `[writable]` config: {@link NsdConfig} 
 * 2. `[signer]` admin: {@link PublicKey} Admin authority account
 *
 * Data:
 * - max_supply: {@link BigInt | undefined} New maximum supply
 * - mint_price: {@link BigInt | undefined} New mint price
 * - is_active: {@link boolean | undefined} New active status
 */
export const updateConfig = (
	args: UpdateConfigArgs,
	remainingAccounts: Array<web3.AccountMeta> = [],
): Promise<web3.TransactionInstruction> =>
    updateConfigBuilder(args, remainingAccounts).instruction();

/**
 * ### Returns a {@link web3.TransactionSignature}
 * Update NSD minting configuration
 *
 * Accounts:
 * 0. `[writable, signer]` fee_payer: {@link PublicKey} 
 * 1. `[writable]` config: {@link NsdConfig} 
 * 2. `[signer]` admin: {@link PublicKey} Admin authority account
 *
 * Data:
 * - max_supply: {@link BigInt | undefined} New maximum supply
 * - mint_price: {@link BigInt | undefined} New mint price
 * - is_active: {@link boolean | undefined} New active status
 */
export const updateConfigSendAndConfirm = async (
  args: Omit<UpdateConfigArgs, "feePayer" | "admin"> & {
    signers: {
      feePayer: web3.Signer,
      admin: web3.Signer,
    },
  },
  remainingAccounts: Array<web3.AccountMeta> = [],
): Promise<web3.TransactionSignature> => {
  const preInstructions: Array<web3.TransactionInstruction> = [];


  return updateConfigBuilder({
      ...args,
      feePayer: args.signers.feePayer.publicKey,
      admin: args.signers.admin.publicKey,
    }, remainingAccounts)
    .preInstructions(preInstructions)
    .signers([args.signers.feePayer, args.signers.admin])
    .rpc();
}

export type SetTokenMetadataArgs = {
  feePayer: web3.PublicKey;
  admin: web3.PublicKey;
  tokenMint: web3.PublicKey;
  name: string;
  symbol: string;
  uri: string;
};

/**
 * ### Returns a {@link MethodsBuilder}
 * Set metadata for NSD tokens
 *
 * Accounts:
 * 0. `[writable, signer]` fee_payer: {@link PublicKey} 
 * 1. `[writable]` config: {@link NsdConfig} 
 * 2. `[writable]` metadata: {@link NsdTokenMetadata} 
 * 3. `[signer]` admin: {@link PublicKey} Admin authority account
 * 4. `[]` system_program: {@link PublicKey} Auto-generated, for account initialization
 *
 * Data:
 * - token_mint: {@link PublicKey} Mint address for NSD token
 * - name: {@link string} Name of the token
 * - symbol: {@link string} Symbol of the token
 * - uri: {@link string} URI for token metadata
 */
export const setTokenMetadataBuilder = (
	args: SetTokenMetadataArgs,
	remainingAccounts: Array<web3.AccountMeta> = [],
): MethodsBuilder<NsdMinting, never> => {
  const [configPubkey] = pda.deriveNsdConfigPDA(_program.programId);
    const [metadataPubkey] = pda.deriveNsdTokenMetadataPDA({
        mint: args.tokenMint,
    }, _program.programId);

  return _program
    .methods
    .setTokenMetadata(
      args.tokenMint,
      args.name,
      args.symbol,
      args.uri,
    )
    .accountsStrict({
      feePayer: args.feePayer,
      config: configPubkey,
      metadata: metadataPubkey,
      admin: args.admin,
      systemProgram: new web3.PublicKey("11111111111111111111111111111111"),
    })
    .remainingAccounts(remainingAccounts);
};

/**
 * ### Returns a {@link web3.TransactionInstruction}
 * Set metadata for NSD tokens
 *
 * Accounts:
 * 0. `[writable, signer]` fee_payer: {@link PublicKey} 
 * 1. `[writable]` config: {@link NsdConfig} 
 * 2. `[writable]` metadata: {@link NsdTokenMetadata} 
 * 3. `[signer]` admin: {@link PublicKey} Admin authority account
 * 4. `[]` system_program: {@link PublicKey} Auto-generated, for account initialization
 *
 * Data:
 * - token_mint: {@link PublicKey} Mint address for NSD token
 * - name: {@link string} Name of the token
 * - symbol: {@link string} Symbol of the token
 * - uri: {@link string} URI for token metadata
 */
export const setTokenMetadata = (
	args: SetTokenMetadataArgs,
	remainingAccounts: Array<web3.AccountMeta> = [],
): Promise<web3.TransactionInstruction> =>
    setTokenMetadataBuilder(args, remainingAccounts).instruction();

/**
 * ### Returns a {@link web3.TransactionSignature}
 * Set metadata for NSD tokens
 *
 * Accounts:
 * 0. `[writable, signer]` fee_payer: {@link PublicKey} 
 * 1. `[writable]` config: {@link NsdConfig} 
 * 2. `[writable]` metadata: {@link NsdTokenMetadata} 
 * 3. `[signer]` admin: {@link PublicKey} Admin authority account
 * 4. `[]` system_program: {@link PublicKey} Auto-generated, for account initialization
 *
 * Data:
 * - token_mint: {@link PublicKey} Mint address for NSD token
 * - name: {@link string} Name of the token
 * - symbol: {@link string} Symbol of the token
 * - uri: {@link string} URI for token metadata
 */
export const setTokenMetadataSendAndConfirm = async (
  args: Omit<SetTokenMetadataArgs, "feePayer" | "admin"> & {
    signers: {
      feePayer: web3.Signer,
      admin: web3.Signer,
    },
  },
  remainingAccounts: Array<web3.AccountMeta> = [],
): Promise<web3.TransactionSignature> => {
  const preInstructions: Array<web3.TransactionInstruction> = [];


  return setTokenMetadataBuilder({
      ...args,
      feePayer: args.signers.feePayer.publicKey,
      admin: args.signers.admin.publicKey,
    }, remainingAccounts)
    .preInstructions(preInstructions)
    .signers([args.signers.feePayer, args.signers.admin])
    .rpc();
}

// Getters

export const getNsdConfig = (
    publicKey: web3.PublicKey,
    commitment?: web3.Commitment
): Promise<IdlAccounts<NsdMinting>["nsdConfig"]> => _program.account.nsdConfig.fetch(publicKey, commitment);

export const getNsdToken = (
    publicKey: web3.PublicKey,
    commitment?: web3.Commitment
): Promise<IdlAccounts<NsdMinting>["nsdToken"]> => _program.account.nsdToken.fetch(publicKey, commitment);

export const getNsdUser = (
    publicKey: web3.PublicKey,
    commitment?: web3.Commitment
): Promise<IdlAccounts<NsdMinting>["nsdUser"]> => _program.account.nsdUser.fetch(publicKey, commitment);

export const getNsdTokenMetadata = (
    publicKey: web3.PublicKey,
    commitment?: web3.Commitment
): Promise<IdlAccounts<NsdMinting>["nsdTokenMetadata"]> => _program.account.nsdTokenMetadata.fetch(publicKey, commitment);
