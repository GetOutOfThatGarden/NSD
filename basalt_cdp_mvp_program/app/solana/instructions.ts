import { PublicKey, SystemProgram, TransactionInstruction } from "@solana/web3.js";
import { Buffer } from "buffer";

import { toU64Le } from "./config";

// Discriminators from Anchor-generated types (target/types/basalt_cdp_mvp.ts)
const DISCRIMINATOR_INITIALIZE = Buffer.from([188, 233, 252, 106, 134, 146, 202, 91]);
const DISCRIMINATOR_MINT = Buffer.from([170, 18, 183, 209, 84, 105, 148, 224]);
const DISCRIMINATOR_REDEEM = Buffer.from([243, 227, 41, 246, 233, 128, 116, 11]);

export function buildInitializeProtocolInstruction(params: {
  owner: PublicKey;
  protocolConfig: PublicKey;
  collateralMint: PublicKey;
  usdrwMint: PublicKey;
  programId: PublicKey;
}): TransactionInstruction {
  const { owner, protocolConfig, collateralMint, usdrwMint, programId } = params;

  const data = Buffer.concat([
    DISCRIMINATOR_INITIALIZE,
    collateralMint.toBuffer(),
    usdrwMint.toBuffer(),
  ]);

  const keys = [
    { pubkey: owner, isSigner: true, isWritable: true },
    { pubkey: protocolConfig, isSigner: false, isWritable: true },
    { pubkey: collateralMint, isSigner: false, isWritable: false },
    { pubkey: usdrwMint, isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ];

  return new TransactionInstruction({ keys, programId, data });
}

export function buildMintUsdrwInstruction(params: {
  user: PublicKey;
  protocolConfig: PublicKey;
  userVault: PublicKey;
  userCollateralAccount: PublicKey;
  protocolCollateralAccount: PublicKey;
  userUsdrwAccount: PublicKey;
  usdrwMint: PublicKey;
  amount: number | string;
  amountDecimals: number;
  programId: PublicKey;
}): TransactionInstruction {
  const {
    user,
    protocolConfig,
    userVault,
    userCollateralAccount,
    protocolCollateralAccount,
    userUsdrwAccount,
    usdrwMint,
    amount,
    amountDecimals,
    programId,
  } = params;

  const data = Buffer.concat([
    DISCRIMINATOR_MINT,
    toU64Le(amount, amountDecimals),
  ]);

  // Account ordering MUST match the Rust program exactly:
  // 1. user (mut, signer)
  // 2. protocol_config (mut)  
  // 3. user_vault (mut)
  // 4. user_collateral_account (mut)
  // 5. protocol_collateral_account (mut)
  // 6. user_usdrw_account (mut)
  // 7. usdrw_mint (mut)
  // 8. token_program
  // 9. system_program
  // 10. associated_token_program
  const keys = [
    { pubkey: user, isSigner: true, isWritable: true },
    { pubkey: protocolConfig, isSigner: false, isWritable: true }, // Fixed: should be writable
    { pubkey: userVault, isSigner: false, isWritable: true },
    { pubkey: userCollateralAccount, isSigner: false, isWritable: true }, // Fixed: should be writable
    { pubkey: protocolCollateralAccount, isSigner: false, isWritable: true },
    { pubkey: userUsdrwAccount, isSigner: false, isWritable: true }, // Fixed: should be writable
    { pubkey: usdrwMint, isSigner: false, isWritable: true }, // Fixed: should be writable
    { pubkey: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"), isSigner: false, isWritable: false }, // TOKEN_PROGRAM_ID
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    { pubkey: new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"), isSigner: false, isWritable: false }, // ASSOCIATED_TOKEN_PROGRAM_ID
  ];

  return new TransactionInstruction({ keys, programId, data });
}

export function buildRedeemCollateralInstruction(params: {
  user: PublicKey;
  protocolConfig: PublicKey;
  userVault: PublicKey;
  userCollateralAccount: PublicKey;
  protocolCollateralAccount: PublicKey;
  userUsdrwAccount: PublicKey;
  usdrwMint: PublicKey;
  amount: number | string;
  amountDecimals: number;
  programId: PublicKey;
}): TransactionInstruction {
  const {
    user,
    protocolConfig,
    userVault,
    userCollateralAccount,
    protocolCollateralAccount,
    userUsdrwAccount,
    usdrwMint,
    amount,
    amountDecimals,
    programId,
  } = params;

  const data = Buffer.concat([
    DISCRIMINATOR_REDEEM,
    toU64Le(amount, amountDecimals),
  ]);

  const keys = [
    { pubkey: user, isSigner: true, isWritable: true },
    { pubkey: protocolConfig, isSigner: false, isWritable: false },
    { pubkey: userVault, isSigner: false, isWritable: true },
    { pubkey: userCollateralAccount, isSigner: false, isWritable: true },
    { pubkey: protocolCollateralAccount, isSigner: false, isWritable: true },
    { pubkey: userUsdrwAccount, isSigner: false, isWritable: true },
    { pubkey: usdrwMint, isSigner: false, isWritable: true },
    { pubkey: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"), isSigner: false, isWritable: false },
  ];

  return new TransactionInstruction({ keys, programId, data });
}