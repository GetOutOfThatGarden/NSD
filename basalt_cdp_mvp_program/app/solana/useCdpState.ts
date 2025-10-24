import { useEffect, useState, useCallback } from 'react';
import { PublicKey } from '@solana/web3.js';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Program } from '@coral-xyz/anchor';
import { getProgram, getVaultPda, getProtocolConfigPda, getCollateralVaultPda } from './client';
import { getProtocolConfigWithErrorHandling, getUserVaultWithErrorHandling, initializeClient } from './client/rpcWithErrorHandling';
import { PROGRAM_ID } from './client';
import { SolanaErrorHandler, useSolanaErrorHandler, type SolanaError } from './utils/errorHandler';

export interface UserVault {
  owner: PublicKey;
  protocolConfig: PublicKey;
  collateralAmount: number;
  debtAmount: number;
  lastInterestUpdate: number;
  bump: number;
}

export interface ProtocolConfig {
  owner: PublicKey;
  collateralMint: PublicKey;
  usdrwMint: PublicKey;
  collateralRatio: number;
  interestRate: number;
  liquidationThreshold: number;
  lastInterestUpdate: number;
  bump: number;
}

export const useCdpState = () => {
  const { connection } = useConnection();
  const { publicKey, wallet } = useWallet();
  const { handleError, withRetry } = useSolanaErrorHandler();
  const [vault, setVault] = useState<UserVault | null>(null);
  const [protocolConfig, setProtocolConfig] = useState<ProtocolConfig | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<SolanaError | null>(null);

  const fetchProtocolConfig = useCallback(async () => {
    try {
      setError(null);
      const [protocolConfigPda] = getProtocolConfigPda();
      const result = await getProtocolConfigWithErrorHandling(protocolConfigPda);
      
      if (result.error) {
        // Protocol might not be initialized yet, this is not necessarily an error
        if (result.error.code !== 'ACCOUNT_NOT_FOUND') {
          setError(result.error);
        }
      } else if (result.data) {
        setProtocolConfig({
          owner: result.data.owner,
          collateralMint: result.data.collateralMint,
          usdrwMint: result.data.usdrwMint,
          collateralRatio: result.data.collateralRatio.toNumber(),
          interestRate: result.data.interestRate.toNumber(),
          liquidationThreshold: result.data.liquidationThreshold.toNumber(),
          lastInterestUpdate: result.data.lastInterestUpdate.toNumber(),
          bump: result.data.bump,
        });
      }
    } catch (error) {
      const solanaError = handleError(error, 'fetchProtocolConfig');
      setError(solanaError);
    }
  }, [handleError]);

  const fetchUserVault = useCallback(async () => {
    if (!publicKey) return;

    try {
      setError(null);
      const [protocolConfigPda] = getProtocolConfigPda();
      const [vaultPda] = getVaultPda(publicKey, protocolConfigPda);
      const result = await getUserVaultWithErrorHandling(vaultPda);
      
      if (result.error) {
        // Vault might not exist yet, this is not necessarily an error
        if (result.error.code === 'ACCOUNT_NOT_FOUND') {
          setVault(null);
          setError(null);
        } else {
          setError(result.error);
        }
      } else if (result.data) {
        setVault({
          owner: result.data.owner,
          protocolConfig: result.data.protocolConfig,
          collateralAmount: result.data.collateralAmount.toNumber(),
          debtAmount: result.data.debtAmount.toNumber(),
          lastInterestUpdate: result.data.lastInterestUpdate.toNumber(),
          bump: result.data.bump,
        });
      } else {
        setVault(null);
      }
    } catch (error) {
      const solanaError = handleError(error, 'fetchUserVault');
      setError(solanaError);
    }
  }, [publicKey, handleError]);

  const refreshState = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Initialize the client if wallet is connected
      if (publicKey) {
        initializeClient(PROGRAM_ID);
      }
      
      await Promise.all([
        fetchProtocolConfig(),
        fetchUserVault(),
      ]);
    } catch (err) {
      const solanaError = handleError(err, 'refreshState');
      setError(solanaError);
    } finally {
      setLoading(false);
    }
  }, [publicKey, fetchProtocolConfig, fetchUserVault, handleError]);

  useEffect(() => {
    refreshState();
  }, [refreshState]);

  // Set up real-time account change listeners
  useEffect(() => {
    if (!connection || !publicKey) return;

    const subscriptions: number[] = [];

    try {
      // Listen for protocol config changes
      const [protocolConfigPda] = getProtocolConfigPda();
      const protocolConfigSub = connection.onAccountChange(
        protocolConfigPda,
        (accountInfo) => {
          console.log('Protocol config changed, refreshing...');
          fetchProtocolConfig();
        },
        'confirmed'
      );
      subscriptions.push(protocolConfigSub);

      // Listen for user vault changes
      const [vaultPda] = getVaultPda(publicKey, protocolConfigPda);
      const vaultSub = connection.onAccountChange(
        vaultPda,
        (accountInfo) => {
          console.log('User vault changed, refreshing...');
          fetchUserVault();
        },
        'confirmed'
      );
      subscriptions.push(vaultSub);
    } catch (err) {
      console.error('Failed to set up account change listeners:', err);
    }

    return () => {
      subscriptions.forEach(sub => {
        try {
          connection.removeAccountChangeListener(sub);
        } catch (err) {
          console.error('Failed to remove account change listener:', err);
        }
      });
    };
  }, [connection, publicKey, fetchProtocolConfig, fetchUserVault]);

  return { 
    vault, 
    protocolConfig, 
    loading, 
    error, 
    refreshState 
  };
};