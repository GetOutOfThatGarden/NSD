import { AnchorProvider } from "@coral-xyz/anchor";
import {
  Keypair,
  PublicKey,
  type AccountMeta,
  type TransactionInstruction,
  type TransactionSignature,
} from "@solana/web3.js";
import { useCallback, useState, useEffect } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import * as programClient from "~/solana/client";

// Props interface for the useProgram hook
export interface UseProgramProps {
  // Optional override for the VITE_SOLANA_PROGRAM_ID env var
  programId?: string;
}

// Error structure returned from sendAndConfirmTx if transaction fails
type SendAndConfirmTxError = {
  message: string;
  logs: string[];
  stack: string | undefined;
};

// Result structure returned from sendAndConfirmTx
type SendAndConfirmTxResult = {
  // Signature of successful transaction
  signature?: string;

  // Error details if transaction fails
  error?: SendAndConfirmTxError;
};

// Helper function to send and confirm a transaction, with error handling
const sendAndConfirmTx = async (
  fn: () => Promise<TransactionSignature>,
): Promise<SendAndConfirmTxResult> => {
  try {
    const signature = await fn();
    return {
      signature,
    };
  } catch (e: any) {
    let message = `An unknown error occurred: ${e}`;
    let logs = [];
    let stack = "";

    if ("logs" in e && e.logs instanceof Array) {
      logs = e.logs;
    }

    if ("stack" in e) {
      stack = e.stack;
    }

    if ("message" in e) {
      message = e.message;
    }

    return {
      error: {
        logs,
        stack,
        message,
      },
    };
  }
};

const useProgram = (props?: UseProgramProps | undefined) => {
  const [programId, setProgramId] = useState<PublicKey|undefined>(undefined)
  const { connection } = useConnection();

  useEffect(() => {
    let prgId = import.meta.env.VITE_SOLANA_PROGRAM_ID as string | undefined;

    if (props?.programId) {
      prgId = props.programId;
    }

    if (!prgId) {
      throw new Error(
        "the program id must be provided either by the useProgram props or the env var VITE_SOLANA_PROGRAM_ID",
      );
    }

    const pid = new PublicKey(prgId)
    setProgramId(pid)
    programClient.initializeClient(pid, new AnchorProvider(connection));
  }, [props?.programId, connection.rpcEndpoint]);

  /**
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
   *
   * @returns {@link TransactionInstruction}
   */
  const initializeConfig = useCallback(programClient.initializeConfig, [])

  /**
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
   *
   * @returns {@link SendAndConfirmTxResult}
   */
  const initializeConfigSendAndConfirm = useCallback(async (
    args: Omit<programClient.InitializeConfigArgs, "feePayer" | "admin"> & {
    signers: {
        feePayer: Keypair,
        admin: Keypair,
    }}, 
    remainingAccounts: Array<AccountMeta> = []
  ): Promise<SendAndConfirmTxResult> => sendAndConfirmTx(() => programClient.initializeConfigSendAndConfirm(args, remainingAccounts)), [])

  /**
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
   *
   * @returns {@link TransactionInstruction}
   */
  const mintTokens = useCallback(programClient.mintTokens, [])

  /**
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
   *
   * @returns {@link SendAndConfirmTxResult}
   */
  const mintTokensSendAndConfirm = useCallback(async (
    args: Omit<programClient.MintTokensArgs, "feePayer" | "user" | "owner"> & {
    signers: {
        feePayer: Keypair,
        user: Keypair,
        owner: Keypair,
    }}, 
    remainingAccounts: Array<AccountMeta> = []
  ): Promise<SendAndConfirmTxResult> => sendAndConfirmTx(() => programClient.mintTokensSendAndConfirm(args, remainingAccounts)), [])

  /**
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
   *
   * @returns {@link TransactionInstruction}
   */
  const updateConfig = useCallback(programClient.updateConfig, [])

  /**
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
   *
   * @returns {@link SendAndConfirmTxResult}
   */
  const updateConfigSendAndConfirm = useCallback(async (
    args: Omit<programClient.UpdateConfigArgs, "feePayer" | "admin"> & {
    signers: {
        feePayer: Keypair,
        admin: Keypair,
    }}, 
    remainingAccounts: Array<AccountMeta> = []
  ): Promise<SendAndConfirmTxResult> => sendAndConfirmTx(() => programClient.updateConfigSendAndConfirm(args, remainingAccounts)), [])

  /**
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
   *
   * @returns {@link TransactionInstruction}
   */
  const setTokenMetadata = useCallback(programClient.setTokenMetadata, [])

  /**
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
   *
   * @returns {@link SendAndConfirmTxResult}
   */
  const setTokenMetadataSendAndConfirm = useCallback(async (
    args: Omit<programClient.SetTokenMetadataArgs, "feePayer" | "admin"> & {
    signers: {
        feePayer: Keypair,
        admin: Keypair,
    }}, 
    remainingAccounts: Array<AccountMeta> = []
  ): Promise<SendAndConfirmTxResult> => sendAndConfirmTx(() => programClient.setTokenMetadataSendAndConfirm(args, remainingAccounts)), [])


  const getNsdConfig = useCallback(programClient.getNsdConfig, [])
  const getNsdToken = useCallback(programClient.getNsdToken, [])
  const getNsdUser = useCallback(programClient.getNsdUser, [])
  const getNsdTokenMetadata = useCallback(programClient.getNsdTokenMetadata, [])

  const deriveNsdConfig = useCallback(programClient.deriveNsdConfigPDA,[])
  const deriveNsdToken = useCallback(programClient.deriveNsdTokenPDA,[])
  const deriveNsdUser = useCallback(programClient.deriveNsdUserPDA,[])
  const deriveNsdTokenMetadata = useCallback(programClient.deriveNsdTokenMetadataPDA,[])
  const deriveAccountFromTokenProgram = useCallback(programClient.TokenProgramPDAs.deriveAccountPDA, [])

  return {
	programId,
    initializeConfig,
    initializeConfigSendAndConfirm,
    mintTokens,
    mintTokensSendAndConfirm,
    updateConfig,
    updateConfigSendAndConfirm,
    setTokenMetadata,
    setTokenMetadataSendAndConfirm,
    getNsdConfig,
    getNsdToken,
    getNsdUser,
    getNsdTokenMetadata,
    deriveNsdConfig,
    deriveNsdToken,
    deriveNsdUser,
    deriveNsdTokenMetadata,
    deriveAccountFromTokenProgram,
  };
};

export { useProgram };