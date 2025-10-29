#!/usr/bin/env ts-node

/**
 * Basalt CDP Protocol - PDA Creation Examples
 * 
 * This script demonstrates how to create Program Derived Addresses (PDAs)
 * using the Basalt Devnet Program ID: 5gzoSxVDDSjdE3pPYu9GuyaDAyV2uBXm34BvWa5epsv3
 * 
 * PDAs are deterministic addresses derived from seeds and a program ID.
 * They allow programs to own accounts and sign transactions programmatically.
 */

import { PublicKey } from '@solana/web3.js';
import { Buffer } from 'buffer';

// Basalt CDP Protocol Program ID (Devnet)
const BASALT_PROGRAM_ID = new PublicKey('5gzoSxVDDSjdE3pPYu9GuyaDAyV2uBXm34BvWa5epsv3');

/**
 * Example user wallet address for demonstration
 * In practice, this would be your actual wallet's public key
 */
const EXAMPLE_USER = new PublicKey('11111111111111111111111111111112');

console.log('🚀 Basalt CDP Protocol - PDA Creation Examples');
console.log('='.repeat(60));
console.log(`Program ID: ${BASALT_PROGRAM_ID.toString()}`);
console.log(`Example User: ${EXAMPLE_USER.toString()}`);
console.log('');

/**
 * 1. Protocol Configuration PDA
 * 
 * This PDA stores the global protocol configuration including:
 * - Collateral mint address
 * - USD_RW mint address
 * - Protocol admin
 * - Interest rates and other parameters
 */
function createProtocolConfigPDA(): [PublicKey, number] {
  const [pda, bump] = PublicKey.findProgramAddressSync(
    [Buffer.from('protocol_config')],
    BASALT_PROGRAM_ID
  );
  
  console.log('📋 Protocol Configuration PDA:');
  console.log(`   Address: ${pda.toString()}`);
  console.log(`   Bump: ${bump}`);
  console.log(`   Seeds: ["protocol_config"]`);
  console.log('');
  
  return [pda, bump];
}

/**
 * 2. User Vault PDA
 * 
 * Each user can have a vault that stores:
 * - Collateral amount deposited
 * - USD_RW debt amount
 * - Last interest calculation timestamp
 * - Vault health metrics
 */
function createUserVaultPDA(userPublicKey: PublicKey, protocolConfig: PublicKey): [PublicKey, number] {
  const [pda, bump] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('user_vault'),
      userPublicKey.toBuffer(),
      protocolConfig.toBuffer()
    ],
    BASALT_PROGRAM_ID
  );
  
  console.log('🏦 User Vault PDA:');
  console.log(`   Address: ${pda.toString()}`);
  console.log(`   Bump: ${bump}`);
  console.log(`   Seeds: ["user_vault", user_pubkey, protocol_config]`);
  console.log(`   User: ${userPublicKey.toString()}`);
  console.log('');
  
  return [pda, bump];
}

/**
 * 3. Protocol Collateral Vault PDA
 * 
 * This PDA represents the protocol's token account that holds all collateral.
 * It's owned by the protocol and used to:
 * - Store user collateral deposits
 * - Transfer collateral during liquidations
 * - Manage protocol-owned collateral
 */
function createProtocolCollateralVaultPDA(protocolConfig: PublicKey): [PublicKey, number] {
  const [pda, bump] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('collateral_vault'),
      protocolConfig.toBuffer()
    ],
    BASALT_PROGRAM_ID
  );
  
  console.log('🏛️  Protocol Collateral Vault PDA:');
  console.log(`   Address: ${pda.toString()}`);
  console.log(`   Bump: ${bump}`);
  console.log(`   Seeds: ["collateral_vault", protocol_config]`);
  console.log('');
  
  return [pda, bump];
}

/**
 * 4. Custom PDA Example
 * 
 * Shows how to create a custom PDA with multiple seeds.
 * This could be used for features like:
 * - User preferences
 * - Liquidation history
 * - Governance proposals
 */
function createCustomPDA(customSeed: string, userPublicKey: PublicKey): [PublicKey, number] {
  const [pda, bump] = PublicKey.findProgramAddressSync(
    [
      Buffer.from(customSeed),
      userPublicKey.toBuffer(),
      Buffer.from('basalt_v1') // Version identifier
    ],
    BASALT_PROGRAM_ID
  );
  
  console.log(`🔧 Custom PDA (${customSeed}):`);
  console.log(`   Address: ${pda.toString()}`);
  console.log(`   Bump: ${bump}`);
  console.log(`   Seeds: ["${customSeed}", user_pubkey, "basalt_v1"]`);
  console.log('');
  
  return [pda, bump];
}

/**
 * 6. Mint Authority PDAs
 * 
 * Dedicated PDAs used as mint authorities for protocol-controlled mints.
 * - SPYx mint authority (for mock collateral mint in dev/testing)
 * - USDrw mint authority (stablecoin mint controlled by the program)
 */
function createMintAuthorityPDA(kind: 'spyx' | 'usdrw'): [PublicKey, number] {
  const seed = kind === 'spyx' ? 'spyx_mint_authority' : 'usdrw_mint_authority';
  const [pda, bump] = PublicKey.findProgramAddressSync(
    [Buffer.from(seed)],
    BASALT_PROGRAM_ID
  );

  const label = kind.toUpperCase();
  console.log(`🔑 ${label} Mint Authority PDA:`);
  console.log(`   Address: ${pda.toString()}`);
  console.log(`   Bump: ${bump}`);
  console.log(`   Seeds: ["${seed}"]`);
  console.log('');

  return [pda, bump];
}

/**
 * 5. PDA Verification Function
 * 
 * Demonstrates how to verify that a given address is indeed a valid PDA
 * for the specified seeds and program ID.
 */
function verifyPDA(address: PublicKey, seeds: Buffer[], programId: PublicKey): boolean {
  try {
    const [derivedPDA] = PublicKey.findProgramAddressSync(seeds, programId);
    const isValid = derivedPDA.equals(address);
    
    console.log('✅ PDA Verification:');
    console.log(`   Given Address: ${address.toString()}`);
    console.log(`   Derived Address: ${derivedPDA.toString()}`);
    console.log(`   Valid: ${isValid ? '✅ YES' : '❌ NO'}`);
    console.log('');
    
    return isValid;
  } catch (error) {
    console.log('❌ PDA Verification Failed:', error);
    return false;
  }
}

/**
 * Main execution function
 */
async function main() {
  try {
    // Create all the standard Basalt protocol PDAs
    const [protocolConfig] = createProtocolConfigPDA();
    const [userVault] = createUserVaultPDA(EXAMPLE_USER, protocolConfig);
    const [collateralVault] = createProtocolCollateralVaultPDA(protocolConfig);

    // Create some custom PDAs
    createCustomPDA('user_preferences', EXAMPLE_USER);
    createCustomPDA('liquidation_history', EXAMPLE_USER);

    // Create mint authority PDAs for protocol-controlled mints
    const [spyxMintAuthority] = createMintAuthorityPDA('spyx');
    const [usdrwMintAuthority] = createMintAuthorityPDA('usdrw');
    
    // Demonstrate PDA verification
    console.log('🔍 PDA Verification Examples:');
    console.log('-'.repeat(40));
    
    // Verify the protocol config PDA
    verifyPDA(
      protocolConfig,
      [Buffer.from('protocol_config')],
      BASALT_PROGRAM_ID
    );
    
    // Verify the user vault PDA
    verifyPDA(
      userVault,
      [
        Buffer.from('user_vault'),
        EXAMPLE_USER.toBuffer(),
        protocolConfig.toBuffer()
      ],
      BASALT_PROGRAM_ID
    );
    
    console.log('📚 Key Concepts:');
    console.log('-'.repeat(40));
    console.log('• PDAs are deterministic - same seeds always produce same address');
    console.log('• PDAs have no private key - only the program can sign for them');
    console.log('• Bump seed ensures the address is off the Ed25519 curve');
    console.log('• Seeds can include strings, public keys, and other data');
    console.log('• PDAs enable programs to own accounts and manage state');
    console.log('');
    
    console.log('🎯 Basalt Protocol Usage:');
    console.log('-'.repeat(40));
    console.log('• protocol_config: Global protocol settings');
    console.log('• user_vault: Individual user CDP positions');
    console.log('• collateral_vault: Protocol-owned collateral storage');
    console.log('• Custom PDAs: Extended functionality and user data');
    console.log('');
    
  } catch (error) {
    console.error('❌ Error creating PDAs:', error);
    throw error;
  }
}

// Export functions for use in other scripts
export {
  BASALT_PROGRAM_ID,
  createProtocolConfigPDA,
  createUserVaultPDA,
  createProtocolCollateralVaultPDA,
  createCustomPDA,
  createMintAuthorityPDA,
  verifyPDA
};

// Run the examples
main().catch(console.error);