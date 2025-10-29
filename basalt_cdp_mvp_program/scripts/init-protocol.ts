#!/usr/bin/env ts-node

import { Connection, PublicKey, Keypair, SystemProgram } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { Program, AnchorProvider, Wallet } from '@coral-xyz/anchor';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the IDL
const idlPath = path.join(__dirname, '../target/idl/basalt_cdp_mvp.json');
const idl = JSON.parse(fs.readFileSync(idlPath, 'utf8'));

// Configuration
const DEVNET_RPC = 'https://api.devnet.solana.com';
const PROGRAM_ID = new PublicKey('5gzoSxVDDSjdE3pPYu9GuyaDAyV2uBXm34BvWa5epsv3');

// Mint addresses from config
const COLLATERAL_MINT = new PublicKey('B5o7is4JQ4azcoNA9U9oN5wQ4DuQmdwLviwudFtiLuZ9'); // SPYx Mock Token
const USDRW_MINT = new PublicKey('CbagCDjUjQNHqbf1F2bvKv4qCFrpxRaFCR6opEMbA1Jo'); // USDrw mint created on devnet

async function initializeProtocol() {
  console.log('🚀 Initializing Basalt CDP Protocol on Devnet...');

  // Setup connection and provider
  const connection = new Connection(DEVNET_RPC, 'confirmed');
  
  // Load wallet
  const walletPath = path.join(process.env.HOME!, '.config/solana/basalt.json');
  const walletKeypair = Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync(walletPath, 'utf8')))
  );
  
  const wallet = new Wallet(walletKeypair);
  const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });
  
  // Create program instance
  const program = new Program(idl, provider);
  
  console.log('📋 Program ID:', PROGRAM_ID.toString());
  console.log('🔑 Wallet:', wallet.publicKey.toString());
  
  try {
    // Derive protocol config PDA
    const [protocolConfigPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('protocol_config')],
      PROGRAM_ID
    );
    
    console.log('🏗️  Protocol Config PDA:', protocolConfigPDA.toString());
    
    // Check if protocol is already initialized
    try {
      const accountInfo = await connection.getAccountInfo(protocolConfigPDA);
      if (accountInfo) {
        console.log('✅ Protocol already initialized!');
        return protocolConfigPDA;
      }
    } catch (error) {
      console.log('📝 Protocol not initialized, proceeding with initialization...');
    }
    
    // Initialize protocol
    console.log('🔨 Initializing protocol configuration...');
    const tx = await program.methods
      .initializeProtocol(COLLATERAL_MINT, USDRW_MINT)
      .accounts({
        owner: wallet.publicKey,
        protocolConfig: protocolConfigPDA,
        collateralMint: COLLATERAL_MINT,
        usdrwMint: USDRW_MINT,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    
    console.log('✅ Protocol initialized! Transaction:', tx);
    console.log('🔍 View on Explorer:', `https://explorer.solana.com/tx/${tx}?cluster=devnet`);
    
    return protocolConfigPDA;
    
  } catch (error) {
    console.error('❌ Protocol initialization failed:', error);
    throw error;
  }
}

async function initializeCollateralVault(protocolConfigPDA: PublicKey) {
  console.log('🏗️  Initializing protocol collateral vault...');
  
  const connection = new Connection(DEVNET_RPC, 'confirmed');
  const walletPath = path.join(process.env.HOME!, '.config/solana/basalt.json');
  const walletKeypair = Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync(walletPath, 'utf8')))
  );
  
  const wallet = new Wallet(walletKeypair);
  const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });
  const program = new Program(idl, provider);
  
  try {
    // Derive protocol collateral vault PDA
  const [protocolCollateralVaultPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('collateral_vault'), protocolConfigPDA.toBuffer()],
    PROGRAM_ID
  );
    
    console.log('🏦 Protocol Collateral Vault PDA:', protocolCollateralVaultPDA.toString());
    
    // Check if vault is already initialized
    try {
      const vaultInfo = await connection.getAccountInfo(protocolCollateralVaultPDA);
      if (vaultInfo) {
        console.log('✅ Collateral vault already initialized!');
        return protocolCollateralVaultPDA;
      }
    } catch (error) {
      console.log('📝 Collateral vault not initialized, proceeding...');
    }
    
    // Initialize collateral vault
    const tx = await program.methods
      .initializeCollateralVault()
      .accounts({
        owner: wallet.publicKey,
        protocolConfig: protocolConfigPDA,
        collateralMint: COLLATERAL_MINT,
        protocolCollateralAccount: protocolCollateralVaultPDA,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    
    console.log('✅ Collateral vault initialized! Transaction:', tx);
    console.log('🔍 View on Explorer:', `https://explorer.solana.com/tx/${tx}?cluster=devnet`);
    
    return protocolCollateralVaultPDA;
    
  } catch (error) {
    console.error('❌ Collateral vault initialization failed:', error);
    throw error;
  }
}

async function main() {
  try {
    // Initialize protocol
    const protocolConfigPDA = await initializeProtocol();
    
    // Initialize collateral vault
    await initializeCollateralVault(protocolConfigPDA);
    
    console.log('🎉 Protocol initialization complete!');
    console.log('💡 You can now test CDP operations in the frontend.');
    
  } catch (error) {
    console.error('💥 Initialization failed:', error);
    process.exit(1);
  }
}

// Run the main function
main();