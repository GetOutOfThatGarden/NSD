import { AnchorError } from '@coral-xyz/anchor';
import { SendTransactionError } from '@solana/web3.js';

export interface SolanaError {
  code: string;
  message: string;
  details?: string;
  isRetryable: boolean;
  userMessage: string;
}

export class SolanaErrorHandler {
  private static readonly ANCHOR_ERROR_CODES: Record<number, string> = {
    6000: 'Insufficient collateral ratio',
    6001: 'Vault is undercollateralized',
    6002: 'Vault is already liquidated',
    6003: 'Mint amount exceeds allowed limit',
    6004: 'Redeem amount exceeds debt',
    6005: 'Collateral amount below minimum',
    6006: 'Maximum vaults per user exceeded',
    6007: 'Vault has no debt to redeem',
    6008: 'Vault has no collateral to liquidate',
    6009: 'Vault is not undercollateralized',
    6010: 'Interest calculation failed',
    6011: 'Protocol not initialized',
    6012: 'Vault not found',
    6013: 'Cannot liquidate your own vault',
    6014: 'Insufficient collateral for minting',
  };

  private static readonly SOLANA_ERROR_PATTERNS: Array<{
    pattern: RegExp;
    code: string;
    message: string;
    isRetryable: boolean;
    userMessage: string;
  }> = [
    {
      pattern: /insufficient funds/i,
      code: 'INSUFFICIENT_FUNDS',
      message: 'Insufficient SOL balance for transaction fees',
      isRetryable: false,
      userMessage: 'You need more SOL in your wallet to pay for transaction fees.',
    },
    {
      pattern: /account not found/i,
      code: 'ACCOUNT_NOT_FOUND',
      message: 'Required account does not exist',
      isRetryable: false,
      userMessage: 'The required account does not exist. You may need to initialize it first.',
    },
    {
      pattern: /blockhash not found/i,
      code: 'BLOCKHASH_NOT_FOUND',
      message: 'Transaction blockhash expired',
      isRetryable: true,
      userMessage: 'Transaction expired. Please try again.',
    },
    {
      pattern: /simulation failed/i,
      code: 'SIMULATION_FAILED',
      message: 'Transaction simulation failed',
      isRetryable: true,
      userMessage: 'Transaction failed during simulation. Please check your inputs and try again.',
    },
    {
      pattern: /network error|timeout/i,
      code: 'NETWORK_ERROR',
      message: 'Network connection error',
      isRetryable: true,
      userMessage: 'Network connection issue. Please check your internet and try again.',
    },
    {
      pattern: /user rejected/i,
      code: 'USER_REJECTED',
      message: 'User rejected the transaction',
      isRetryable: false,
      userMessage: 'Transaction was cancelled.',
    },
    {
      pattern: /wallet not connected/i,
      code: 'WALLET_NOT_CONNECTED',
      message: 'Wallet is not connected',
      isRetryable: false,
      userMessage: 'Please connect your wallet first.',
    },
  ];

  static parseError(error: unknown): SolanaError {
    console.error('Parsing Solana error:', error);

    // Handle AnchorError (program errors)
    if (error instanceof AnchorError) {
      const errorCode = error.error.errorCode.number;
      const errorMessage = this.ANCHOR_ERROR_CODES[errorCode] || error.error.errorMessage;
      
      return {
        code: `ANCHOR_${errorCode}`,
        message: errorMessage,
        details: error.error.errorMessage,
        isRetryable: false,
        userMessage: this.getAnchorErrorUserMessage(errorCode, errorMessage),
      };
    }

    // Handle SendTransactionError
    if (error instanceof SendTransactionError) {
      const logs = error.logs?.join('\n') || '';
      
      // Try to extract program error from logs
      const programErrorMatch = logs.match(/Program log: Error: (.+)/);
      if (programErrorMatch) {
        return {
          code: 'PROGRAM_ERROR',
          message: programErrorMatch[1],
          details: logs,
          isRetryable: false,
          userMessage: `Transaction failed: ${programErrorMatch[1]}`,
        };
      }

      return {
        code: 'SEND_TRANSACTION_ERROR',
        message: error.message,
        details: logs,
        isRetryable: true,
        userMessage: 'Transaction failed to send. Please try again.',
      };
    }

    // Handle generic errors with pattern matching
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    for (const pattern of this.SOLANA_ERROR_PATTERNS) {
      if (pattern.pattern.test(errorMessage)) {
        return {
          code: pattern.code,
          message: pattern.message,
          details: errorMessage,
          isRetryable: pattern.isRetryable,
          userMessage: pattern.userMessage,
        };
      }
    }

    // Default error handling
    return {
      code: 'UNKNOWN_ERROR',
      message: errorMessage,
      details: error instanceof Error ? error.stack : undefined,
      isRetryable: true,
      userMessage: 'An unexpected error occurred. Please try again.',
    };
  }

  private static getAnchorErrorUserMessage(errorCode: number, errorMessage: string): string {
    switch (errorCode) {
      case 6000:
        return 'You need to provide more collateral to maintain the required ratio.';
      case 6001:
        return 'Your vault is undercollateralized and at risk of liquidation.';
      case 6002:
        return 'This vault has already been liquidated.';
      case 6003:
        return 'The amount you\'re trying to mint exceeds the allowed limit.';
      case 6004:
        return 'You\'re trying to redeem more than your current debt.';
      case 6005:
        return 'The collateral amount is below the minimum required.';
      case 6006:
        return 'You\'ve reached the maximum number of vaults allowed per user.';
      case 6007:
        return 'This vault has no debt to redeem.';
      case 6008:
        return 'This vault has no collateral available for liquidation.';
      case 6009:
        return 'This vault is not undercollateralized and cannot be liquidated.';
      case 6010:
        return 'Failed to calculate interest. Please try again.';
      case 6011:
        return 'The protocol has not been initialized yet.';
      case 6012:
        return 'Vault not found. You may need to create one first.';
      case 6013:
        return 'You cannot liquidate your own vault.';
      case 6014:
        return 'You don\'t have enough collateral to mint this amount.';
      default:
        return errorMessage || 'A program error occurred.';
    }
  }

  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000
  ): Promise<T> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        const parsedError = this.parseError(error);
        
        // Don't retry if error is not retryable or this is the last attempt
        if (!parsedError.isRetryable || attempt === maxRetries) {
          throw error;
        }

        // Wait before retrying with exponential backoff
        const delay = delayMs * Math.pow(2, attempt);
        console.log(`Retrying operation in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  static logError(error: SolanaError, context?: string): void {
    console.error(`Solana Error${context ? ` in ${context}` : ''}:`, {
      code: error.code,
      message: error.message,
      details: error.details,
      isRetryable: error.isRetryable,
      userMessage: error.userMessage,
    });
  }
}

// Utility function for handling async operations with error parsing
export async function handleSolanaOperation<T>(
  operation: () => Promise<T>,
  context?: string
): Promise<{ data?: T; error?: SolanaError }> {
  try {
    const data = await operation();
    return { data };
  } catch (error) {
    const parsedError = SolanaErrorHandler.parseError(error);
    SolanaErrorHandler.logError(parsedError, context);
    return { error: parsedError };
  }
}

// Hook for handling errors in React components
export function useSolanaErrorHandler() {
  const handleError = (error: unknown, context?: string): SolanaError => {
    const parsedError = SolanaErrorHandler.parseError(error);
    SolanaErrorHandler.logError(parsedError, context);
    return parsedError;
  };

  const withRetry = <T>(
    operation: () => Promise<T>,
    maxRetries?: number,
    delayMs?: number
  ): Promise<T> => {
    return SolanaErrorHandler.withRetry(operation, maxRetries, delayMs);
  };

  return { handleError, withRetry };
}