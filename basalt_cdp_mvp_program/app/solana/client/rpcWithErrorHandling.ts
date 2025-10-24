import { web3 } from '@coral-xyz/anchor';
import { SolanaErrorHandler, handleSolanaOperation } from '../utils/errorHandler';
import * as rpc from './rpc';

// Enhanced RPC functions with error handling and retry logic

export const initializeProtocolWithErrorHandling = async (
  args: Omit<rpc.InitializeProtocolArgs, "feePayer" | "admin"> & {
    signers: {
      feePayer: web3.Signer,
      admin: web3.Signer,
    },
  },
  remainingAccounts: Array<web3.AccountMeta> = []
) => {
  return handleSolanaOperation(
    () => SolanaErrorHandler.withRetry(
      () => rpc.initializeProtocolSendAndConfirm(args, remainingAccounts),
      2, // max retries
      1500 // delay in ms
    ),
    'initializeProtocol'
  );
};

export const mintUsdrwWithErrorHandling = async (
  args: Omit<rpc.MintUsdrwArgs, "feePayer" | "user" | "userUsdrwAccount" | "owner"> & {
    signers: {
      feePayer: web3.Signer,
      user: web3.Signer,
      userUsdrwAccount: web3.Signer,
      owner: web3.Signer,
    },
  },
  remainingAccounts: Array<web3.AccountMeta> = []
) => {
  return handleSolanaOperation(
    () => SolanaErrorHandler.withRetry(
      () => rpc.mintUsdrwSendAndConfirm(args, remainingAccounts),
      2,
      1500
    ),
    'mintUsdrw'
  );
};

export const redeemCollateralWithErrorHandling = async (
  args: Omit<rpc.RedeemCollateralArgs, "feePayer" | "user" | "owner" | "authority"> & {
    signers: {
      feePayer: web3.Signer,
      user: web3.Signer,
      owner: web3.Signer,
      authority: web3.Signer,
    },
  },
  remainingAccounts: Array<web3.AccountMeta> = []
) => {
  return handleSolanaOperation(
    () => SolanaErrorHandler.withRetry(
      () => rpc.redeemCollateralSendAndConfirm(args, remainingAccounts),
      2,
      1500
    ),
    'redeemCollateral'
  );
};

export const liquidateVaultWithErrorHandling = async (
  args: Omit<rpc.LiquidateVaultArgs, "feePayer" | "liquidator" | "authority" | "owner"> & {
    signers: {
      feePayer: web3.Signer,
      liquidator: web3.Signer,
      authority: web3.Signer,
      owner: web3.Signer,
    },
  },
  remainingAccounts: Array<web3.AccountMeta> = []
) => {
  return handleSolanaOperation(
    () => SolanaErrorHandler.withRetry(
      () => rpc.liquidateVaultSendAndConfirm(args, remainingAccounts),
      2,
      1500
    ),
    'liquidateVault'
  );
};

export const calculateInterestWithErrorHandling = async (
  args: Omit<rpc.CalculateInterestArgs, "feePayer"> & {
    signers: {
      feePayer: web3.Signer,
    },
  },
  remainingAccounts: Array<web3.AccountMeta> = []
) => {
  return handleSolanaOperation(
    () => SolanaErrorHandler.withRetry(
      () => rpc.calculateInterestSendAndConfirm(args, remainingAccounts),
      2,
      1500
    ),
    'calculateInterest'
  );
};

// Enhanced account fetching functions with error handling
export const getProtocolConfigWithErrorHandling = async (
  publicKey: web3.PublicKey,
  commitment?: web3.Commitment
) => {
  return handleSolanaOperation(
    () => SolanaErrorHandler.withRetry(
      () => rpc.getProtocolConfig(publicKey, commitment),
      3, // More retries for read operations
      1000
    ),
    'getProtocolConfig'
  );
};

export const getUserVaultWithErrorHandling = async (
  publicKey: web3.PublicKey,
  commitment?: web3.Commitment
) => {
  return handleSolanaOperation(
    () => SolanaErrorHandler.withRetry(
      () => rpc.getUserVault(publicKey, commitment),
      3,
      1000
    ),
    'getUserVault'
  );
};

// Transaction confirmation utilities
export interface TransactionConfirmationOptions {
  maxRetries?: number;
  retryDelayMs?: number;
  commitment?: web3.Commitment;
  timeoutMs?: number;
}

export const confirmTransactionWithRetry = async (
  connection: web3.Connection,
  signature: string,
  options: TransactionConfirmationOptions = {}
): Promise<web3.RpcResponseAndContext<web3.SignatureResult>> => {
  const {
    maxRetries = 5,
    retryDelayMs = 2000,
    commitment = 'confirmed',
    timeoutMs = 60000
  } = options;

  return SolanaErrorHandler.withRetry(
    async () => {
      const startTime = Date.now();
      
      while (Date.now() - startTime < timeoutMs) {
        try {
          const result = await connection.confirmTransaction(signature, commitment);
          
          if (result.value.err) {
            throw new Error(`Transaction failed: ${JSON.stringify(result.value.err)}`);
          }
          
          return result;
        } catch (error) {
          // If it's a timeout or network error, continue retrying
          if (Date.now() - startTime >= timeoutMs) {
            throw new Error(`Transaction confirmation timeout after ${timeoutMs}ms`);
          }
          
          // Wait before next attempt
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      throw new Error(`Transaction confirmation timeout after ${timeoutMs}ms`);
    },
    maxRetries,
    retryDelayMs
  );
};

// Utility for sending and confirming transactions with comprehensive error handling
export const sendAndConfirmTransactionWithRetry = async (
  connection: web3.Connection,
  transaction: web3.Transaction,
  signers: web3.Signer[],
  options: TransactionConfirmationOptions = {}
): Promise<string> => {
  return SolanaErrorHandler.withRetry(
    async () => {
      // Get fresh blockhash
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.lastValidBlockHeight = lastValidBlockHeight;
      
      // Sign and send transaction
      const signature = await connection.sendTransaction(transaction, signers, {
        skipPreflight: false,
        preflightCommitment: 'processed',
      });
      
      // Confirm transaction
      await confirmTransactionWithRetry(connection, signature, options);
      
      return signature;
    },
    options.maxRetries || 3,
    options.retryDelayMs || 2000
  );
};

// Re-export original RPC functions for cases where error handling wrapper is not needed
export * from './rpc';