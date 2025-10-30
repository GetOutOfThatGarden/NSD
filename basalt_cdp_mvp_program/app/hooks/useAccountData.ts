import { useState, useEffect, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { 
  fetchUserVault, 
  fetchProtocolConfig, 
  subscribeToUserVault, 
  subscribeToProtocolConfig,
  UserVault, 
  ProtocolConfig,
  calculateHealthRatio,
  isVaultLiquidatable,
  fixedPointToDecimal
} from '../solana/utils/accounts';
import { findUserVaultPda, findProtocolConfigPda } from '../solana/pdas';
import { PROGRAM_ID } from '../solana/config';

export interface AccountData {
  userVault: UserVault | null;
  protocolConfig: ProtocolConfig | null;
  isLoading: boolean;
  error: string | null;
  healthRatio: number;
  isLiquidatable: boolean;
  collateralValue: number;
  debtValue: number;
  refreshData: () => Promise<void>;
}

export function useAccountData(): AccountData {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  
  const [userVault, setUserVault] = useState<UserVault | null>(null);
  const [protocolConfig, setProtocolConfig] = useState<ProtocolConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate derived values
  const healthRatio = userVault && protocolConfig 
    ? calculateHealthRatio(userVault.collateralAmount, userVault.debtAmount)
    : 0;

  const isLiquidatable = userVault && protocolConfig 
    ? isVaultLiquidatable(userVault, protocolConfig)
    : false;

  const collateralValue = userVault 
    ? Number(userVault.collateralAmount) / 1e9 // Assuming 9 decimals for SPY
    : 0;

  const debtValue = userVault 
    ? Number(userVault.debtAmount) / 1e6 // Assuming 6 decimals for USDrw
    : 0;

  // Fetch account data
  const fetchAccountData = useCallback(async () => {
    if (!publicKey || !connection) {
      setUserVault(null);
      setProtocolConfig(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get PDAs
      const [protocolConfigPda] = findProtocolConfigPda(PROGRAM_ID);
      const [userVaultPda] = findUserVaultPda(publicKey, protocolConfigPda, PROGRAM_ID);

      // Fetch both accounts in parallel
      const [vaultData, configData] = await Promise.all([
        fetchUserVault(connection, userVaultPda),
        fetchProtocolConfig(connection, protocolConfigPda)
      ]);

      setUserVault(vaultData);
      setProtocolConfig(configData);
    } catch (err) {
      console.error('Error fetching account data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch account data');
    } finally {
      setIsLoading(false);
    }
  }, [connection, publicKey]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!publicKey || !connection) {
      return;
    }

    let userVaultSubscription: number | null = null;
    let protocolConfigSubscription: number | null = null;

    const setupSubscriptions = async () => {
      try {
        // Get PDAs
        const [protocolConfigPda] = findProtocolConfigPda(PROGRAM_ID);
        const [userVaultPda] = findUserVaultPda(publicKey, protocolConfigPda, PROGRAM_ID);

        // Subscribe to user vault changes
        userVaultSubscription = subscribeToUserVault(
          connection,
          userVaultPda,
          (vault) => {
            setUserVault(vault);
          }
        );

        // Subscribe to protocol config changes
        protocolConfigSubscription = subscribeToProtocolConfig(
          connection,
          protocolConfigPda,
          (config) => {
            setProtocolConfig(config);
          }
        );

        // Initial fetch
        await fetchAccountData();
      } catch (err) {
        console.error('Error setting up subscriptions:', err);
        setError(err instanceof Error ? err.message : 'Failed to set up subscriptions');
      }
    };

    setupSubscriptions();

    // Cleanup subscriptions
    return () => {
      if (userVaultSubscription !== null) {
        connection.removeAccountChangeListener(userVaultSubscription);
      }
      if (protocolConfigSubscription !== null) {
        connection.removeAccountChangeListener(protocolConfigSubscription);
      }
    };
  }, [connection, publicKey, fetchAccountData]);

  return {
    userVault,
    protocolConfig,
    isLoading,
    error,
    healthRatio,
    isLiquidatable,
    collateralValue,
    debtValue,
    refreshData: fetchAccountData,
  };
}