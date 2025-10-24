import { useWallet } from '@solana/wallet-adapter-react';
import useSWR from 'swr';
import { PublicKey } from '@solana/web3.js';
import { PROGRAM_ID, getProtocolConfigPda } from './client';
import { 
  getProtocolConfigWithErrorHandling, 
  getUserVaultWithErrorHandling 
} from './client/rpcWithErrorHandling';
import { useSolanaErrorHandler, SolanaError } from './utils/errorHandler';

// Define interfaces for our data structures
interface UserVault {
  owner: PublicKey;
  collateralMint: PublicKey;
  collateralAmount: number;
  debtAmount: number;
  lastInterestUpdate: number;
}

interface ProtocolConfig {
  authority: PublicKey;
  collateralMint: PublicKey;
  collateralizationRatio: number;
  liquidationThreshold: number;
  interestRate: number;
  totalSupply: number;
  totalCollateral: number;
}

// SWR fetcher functions
const fetchProtocolConfig = async (): Promise<ProtocolConfig | null> => {
  const [protocolConfigPda] = getProtocolConfigPda();
  const result = await getProtocolConfigWithErrorHandling(protocolConfigPda);
  if (result.data) {
    return result.data;
  }
  if (result.error?.code === 'ACCOUNT_NOT_FOUND') {
    return null;
  }
  throw new Error(result.error?.message || 'Failed to fetch protocol config');
};

const fetchUserVault = async (publicKey: PublicKey): Promise<UserVault | null> => {
  const result = await getUserVaultWithErrorHandling(publicKey);
  if (result.data) {
    return result.data;
  }
  if (result.error?.code === 'ACCOUNT_NOT_FOUND') {
    return null;
  }
  throw new Error(result.error?.message || 'Failed to fetch user vault');
};

// Custom hook using SWR for CDP state management
export const useCdpStateWithSWR = () => {
  const { publicKey } = useWallet();
  const { handleError } = useSolanaErrorHandler();

  // Fetch protocol configuration
  const {
    data: protocolConfig,
    error: protocolError,
    isLoading: protocolLoading,
    mutate: mutateProtocolConfig
  } = useSWR(
    'protocol-config',
    fetchProtocolConfig,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      onError: (error) => {
        handleError(error);
      }
    }
  );

  // Fetch user vault (only if wallet is connected)
  const {
    data: vault,
    error: vaultError,
    isLoading: vaultLoading,
    mutate: mutateVault
  } = useSWR(
    publicKey ? ['user-vault', publicKey.toString()] : null,
    () => publicKey ? fetchUserVault(publicKey) : null,
    {
      refreshInterval: 15000, // Refresh every 15 seconds
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      onError: (error) => {
        handleError(error);
      }
    }
  );

  // Combined loading state
  const loading = protocolLoading || (publicKey ? vaultLoading : false);

  // Combined error state
  const error: SolanaError | null = protocolError || vaultError || null;

  // Refresh function to manually trigger data refetch
  const refreshState = async () => {
    await Promise.all([
      mutateProtocolConfig(),
      publicKey ? mutateVault() : Promise.resolve()
    ]);
  };

  // Optimistic update functions for better UX
  const optimisticUpdateVault = (updater: (vault: UserVault | null) => UserVault | null) => {
    mutateVault((currentData) => updater(currentData ?? null), false); // Don't revalidate immediately
  };

  const optimisticUpdateProtocolConfig = (updater: (config: ProtocolConfig | null) => ProtocolConfig | null) => {
    mutateProtocolConfig((currentData) => updater(currentData ?? null), false); // Don't revalidate immediately
  };

  return {
    vault,
    protocolConfig,
    loading,
    error,
    refreshState,
    optimisticUpdateVault,
    optimisticUpdateProtocolConfig,
    // Expose mutate functions for manual cache management
    mutateVault,
    mutateProtocolConfig
  };
};

// Helper hook for transaction operations with optimistic updates
export const useCdpTransactions = () => {
  const { optimisticUpdateVault, optimisticUpdateProtocolConfig, mutateVault, mutateProtocolConfig } = useCdpStateWithSWR();

  const executeWithOptimisticUpdate = async <T>(
    operation: () => Promise<T>,
    vaultUpdater?: (vault: UserVault | null) => UserVault | null,
    protocolUpdater?: (config: ProtocolConfig | null) => ProtocolConfig | null
  ): Promise<T> => {
    // Apply optimistic updates
    if (vaultUpdater) {
      optimisticUpdateVault(vaultUpdater);
    }
    if (protocolUpdater) {
      optimisticUpdateProtocolConfig(protocolUpdater);
    }

    try {
      const result = await operation();
      
      // Revalidate data after successful operation
      await Promise.all([
        mutateVault(),
        mutateProtocolConfig()
      ]);
      
      return result;
    } catch (error) {
      // Revert optimistic updates on error
      await Promise.all([
        mutateVault(),
        mutateProtocolConfig()
      ]);
      throw error;
    }
  };

  return {
    executeWithOptimisticUpdate
  };
};