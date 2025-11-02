import { Connection, PublicKey } from '@solana/web3.js';
import { BorshAccountsCoder } from '@coral-xyz/anchor';

// Account structures matching the Rust program
export interface UserVault {
  owner: PublicKey;
  protocolConfig: PublicKey;
  collateralAmount: bigint;
  debtAmount: bigint;
  lastInterestUpdate: bigint;
  bump: number;
}

export interface ProtocolConfig {
  owner: PublicKey;
  collateralMint: PublicKey;
  usdrwMint: PublicKey;
  collateralRatio: bigint;
  interestRate: bigint;
  liquidationThreshold: bigint;
  lastInterestUpdate: bigint;
  bump: number;
}

// IDL schema for account deserialization
const USER_VAULT_SCHEMA = {
  struct: {
    owner: { array: { type: 'u8', len: 32 } },
    protocolConfig: { array: { type: 'u8', len: 32 } },
    collateralAmount: 'u64',
    debtAmount: 'u64',
    lastInterestUpdate: 'i64',
    bump: 'u8',
  }
};

const PROTOCOL_CONFIG_SCHEMA = {
  struct: {
    owner: { array: { type: 'u8', len: 32 } },
    collateralMint: { array: { type: 'u8', len: 32 } },
    usdrwMint: { array: { type: 'u8', len: 32 } },
    collateralRatio: 'u64',
    interestRate: 'u64',
    liquidationThreshold: 'u64',
    lastInterestUpdate: 'i64',
    bump: 'u8',
  }
};

/**
 * Fetch and deserialize a UserVault account
 */
export async function fetchUserVault(
  connection: Connection,
  userVaultPda: PublicKey
): Promise<UserVault | null> {
  try {
    const accountInfo = await connection.getAccountInfo(userVaultPda);
    if (!accountInfo || !accountInfo.data) {
      return null;
    }

    // Skip the 8-byte discriminator
    const data = accountInfo.data.slice(8);
    
    // Manual deserialization based on the Rust struct layout
    let offset = 0;
    
    const owner = new PublicKey(data.slice(offset, offset + 32));
    offset += 32;
    
    const protocolConfig = new PublicKey(data.slice(offset, offset + 32));
    offset += 32;
    
    const collateralAmount = data.readBigUInt64LE(offset);
    offset += 8;
    
    const debtAmount = data.readBigUInt64LE(offset);
    offset += 8;
    
    const lastInterestUpdate = data.readBigInt64LE(offset);
    offset += 8;
    
    const bump = data.readUInt8(offset);

    return {
      owner,
      protocolConfig,
      collateralAmount,
      debtAmount,
      lastInterestUpdate,
      bump,
    };
  } catch (error) {
    console.error('Error fetching user vault:', error);
    return null;
  }
}

/**
 * Fetch and deserialize a ProtocolConfig account
 */
export async function fetchProtocolConfig(
  connection: Connection,
  protocolConfigPda: PublicKey
): Promise<ProtocolConfig | null> {
  try {
    const accountInfo = await connection.getAccountInfo(protocolConfigPda);
    if (!accountInfo || !accountInfo.data) {
      return null;
    }

    // Skip the 8-byte discriminator
    const data = accountInfo.data.slice(8);
    
    // Manual deserialization based on the Rust struct layout
    let offset = 0;
    
    const owner = new PublicKey(data.slice(offset, offset + 32));
    offset += 32;
    
    const collateralMint = new PublicKey(data.slice(offset, offset + 32));
    offset += 32;
    
    const usdrwMint = new PublicKey(data.slice(offset, offset + 32));
    offset += 32;
    
    const collateralRatio = data.readBigUInt64LE(offset);
    offset += 8;
    
    const interestRate = data.readBigUInt64LE(offset);
    offset += 8;
    
    const liquidationThreshold = data.readBigUInt64LE(offset);
    offset += 8;
    
    const lastInterestUpdate = data.readBigInt64LE(offset);
    offset += 8;
    
    const bump = data.readUInt8(offset);

    return {
      owner,
      collateralMint,
      usdrwMint,
      collateralRatio,
      interestRate,
      liquidationThreshold,
      lastInterestUpdate,
      bump,
    };
  } catch (error) {
    console.error('Error fetching protocol config:', error);
    return null;
  }
}

/**
 * Subscribe to account changes for real-time updates
 */
export function subscribeToUserVault(
  connection: Connection,
  userVaultPda: PublicKey,
  callback: (vault: UserVault | null) => void
): number {
  return connection.onAccountChange(
    userVaultPda,
    async (accountInfo) => {
      if (!accountInfo || !accountInfo.data) {
        callback(null);
        return;
      }

      const vault = await fetchUserVault(connection, userVaultPda);
      callback(vault);
    },
    'confirmed'
  );
}

/**
 * Subscribe to protocol config changes
 */
export function subscribeToProtocolConfig(
  connection: Connection,
  protocolConfigPda: PublicKey,
  callback: (config: ProtocolConfig | null) => void
): number {
  return connection.onAccountChange(
    protocolConfigPda,
    async (accountInfo) => {
      if (!accountInfo || !accountInfo.data) {
        callback(null);
        return;
      }

      const config = await fetchProtocolConfig(connection, protocolConfigPda);
      callback(config);
    },
    'confirmed'
  );
}

/**
 * Utility to convert fixed-point 64.64 to decimal
 */
export function fixedPointToDecimal(value: bigint, decimals: number = 18): number {
  // For 64.64 fixed point, divide by 2^64
  const divisor = 2n ** 64n;
  const wholePart = value / divisor;
  const fractionalPart = value % divisor;
  
  // Convert to decimal with specified precision
  const decimal = Number(wholePart) + Number(fractionalPart) / Number(divisor);
  return Math.round(decimal * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

/**
 * Utility to convert decimal to fixed-point 64.64
 */
export function decimalToFixedPoint(value: number): bigint {
  const multiplier = 2n ** 64n;
  return BigInt(Math.floor(value * Number(multiplier)));
}

/**
 * Calculate health ratio for a vault
 */
export function calculateHealthRatio(
  collateralAmount: bigint,
  debtAmount: bigint,
  collateralPrice: number = 1, // SPY price
  debtPrice: number = 1 // USDrw price (should be ~1)
): number {
  if (debtAmount === BigInt(0)) {
    return Infinity; // No debt means infinite health
  }

  const collateralValue = Number(collateralAmount) * collateralPrice;
  const debtValue = Number(debtAmount) * debtPrice;
  
  return collateralValue / debtValue;
}

/**
 * Check if a vault is liquidatable
 */
export function isVaultLiquidatable(
  vault: UserVault,
  protocolConfig: ProtocolConfig,
  collateralPrice: number = 1
): boolean {
  const healthRatio = calculateHealthRatio(
    vault.collateralAmount,
    vault.debtAmount,
    collateralPrice
  );
  
  const liquidationThreshold = fixedPointToDecimal(protocolConfig.liquidationThreshold);
  return healthRatio < liquidationThreshold;
}