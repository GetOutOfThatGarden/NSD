import { Connection, clusterApiUrl } from '@solana/web3.js';

// Solana cluster endpoints as recommended by the official documentation
export const CLUSTER_ENDPOINTS = {
  'mainnet-beta': 'https://api.mainnet-beta.solana.com',
  'devnet': 'https://api.devnet.solana.com',
  'testnet': 'https://api.testnet.solana.com',
  'localnet': 'http://localhost:8899'
} as const;

export type ClusterType = keyof typeof CLUSTER_ENDPOINTS;

// Default to devnet for development
export const DEFAULT_CLUSTER: ClusterType = 'devnet';

/**
 * Create a Solana RPC connection following the recommended patterns
 * from https://solana.com/developers/cookbook/development/connect-environment
 */
export const createSolanaConnection = (
  cluster: ClusterType = DEFAULT_CLUSTER,
  commitment: 'processed' | 'confirmed' | 'finalized' = 'confirmed'
): Connection => {
  const endpoint = CLUSTER_ENDPOINTS[cluster];
  
  return new Connection(endpoint, {
    commitment,
    confirmTransactionInitialTimeout: 60000, // 60 seconds
    wsEndpoint: cluster === 'devnet' ? 'wss://api.devnet.solana.com' : undefined
  });
};

/**
 * Get the current cluster from environment or default to devnet
 */
export const getCurrentCluster = (): ClusterType => {
  const envCluster = import.meta.env.VITE_SOLANA_CLUSTER as ClusterType;
  return envCluster && envCluster in CLUSTER_ENDPOINTS ? envCluster : DEFAULT_CLUSTER;
};

/**
 * Default connection instance for the app
 */
export const defaultConnection = createSolanaConnection(getCurrentCluster());

/**
 * Helper to get cluster URL using Solana's built-in helper for standard clusters
 */
export const getClusterUrl = (cluster: ClusterType): string => {
  if (cluster === 'localnet') {
    return CLUSTER_ENDPOINTS.localnet;
  }
  return clusterApiUrl(cluster);
};