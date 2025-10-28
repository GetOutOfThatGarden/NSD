bimport { PublicKey } from '@solana/web3.js';
import { ClusterType, getCurrentCluster } from './connection';

/**
 * Environment-specific configuration following Solana best practices
 */
export interface SolanaConfig {
  cluster: ClusterType;
  programId: PublicKey;
  commitment: 'processed' | 'confirmed' | 'finalized';
}

/**
 * Program IDs for different environments
 * Replace these with your actual deployed program IDs
 */
const PROGRAM_IDS: Record<ClusterType, string> = {
  'localhost': '5gzoSxVDDSjdE3pPYu9GuyaDAyV2uBXm34BvWa5epsv3',
  'devnet': '5gzoSxVDDSjdE3pPYu9GuyaDAyV2uBXm34BvWa5epsv3',
  'testnet': '5gzoSxVDDSjdE3pPYu9GuyaDAyV2uBXm34BvWa5epsv3',
  'mainnet-beta': '5gzoSxVDDSjdE3pPYu9GuyaDAyV2uBXm34BvWa5epsv3'
};

/**
 * Get configuration for the current environment
 */
export const getSolanaConfig = (): SolanaConfig => {
  const cluster = getCurrentCluster();
  
  return {
    cluster,
    programId: new PublicKey(PROGRAM_IDS[cluster]),
    commitment: cluster === 'localhost' ? 'processed' : 'confirmed'
  };
};

/**
 * Current environment configuration
 */
export const SOLANA_CONFIG = getSolanaConfig();

/**
 * Export the program ID for the current environment
 */
export const PROGRAM_ID = SOLANA_CONFIG.programId;