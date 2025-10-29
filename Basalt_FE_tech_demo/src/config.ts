import { PublicKey } from '@solana/web3.js';

// Devnet configuration
export const DEVNET_CONFIG = {
  // Program ID from IDL (deployed address)
  PROGRAM_ID: new PublicKey('5gzoSxVDDSjdE3pPYu9GuyaDAyV2uBXm34BvWa5epsv3'),
  
  // Mint addresses - USDrw mint created on devnet
  USDRW_MINT: new PublicKey('CbagCDjUjQNHqbf1F2bvKv4qCFrpxRaFCR6opEMbA1Jo'),
  COLLATERAL_MINT: new PublicKey('B5o7is4JQ4azcoNA9U9oN5wQ4DuQmdwLviwudFtiLuZ9'), // SPYx Mock Token
  
  // Token decimals
  USDRW_DECIMALS: 6,
  COLLATERAL_DECIMALS: 9,
  
  // Network
  RPC_URL: 'https://api.devnet.solana.com',
  CLUSTER: 'devnet' as const,
  
  // Wallet
  WALLET_PATH: '/Users/user2/.config/solana/basalt.json'
};

// For easier access
export const {
  PROGRAM_ID,
  USDRW_MINT,
  COLLATERAL_MINT,
  USDRW_DECIMALS,
  COLLATERAL_DECIMALS,
  RPC_URL,
  CLUSTER
} = DEVNET_CONFIG;