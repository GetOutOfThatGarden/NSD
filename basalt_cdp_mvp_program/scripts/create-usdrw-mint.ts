#!/usr/bin/env ts-node
/// <reference types="node" />

/**
 * Create USDrw Mint on Devnet with Correct PDA Authority
 *
 * This script creates the USDrw (USD_RW) SPL Token mint on Solana Devnet
 * and sets its `mint_authority` and `freeze_authority` to the Basalt
 * Protocol's `protocol_config` PDA, which is what the on-chain program
 * expects for minting via CPI.
 */

import { Connection, PublicKey, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { createMint } from '@solana/spl-token';
import { Buffer } from 'buffer';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Basalt CDP Protocol Program ID (Devnet)
const BASALT_PROGRAM_ID = new PublicKey('5gzoSxVDDSjdE3pPYu9GuyaDAyV2uBXm34BvWa5epsv3');

// USDrw mint decimals (USD-like token)
const USDRW_DECIMALS = 6;

function deriveProtocolConfigPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from('protocol_config')], BASALT_PROGRAM_ID);
}

async function ensureSolBalance(connection: Connection, pubkey: PublicKey) {
  const balance = await connection.getBalance(pubkey);
  if (balance < 1 * LAMPORTS_PER_SOL) {
    console.log('💧 Airdropping 2 SOL to payer (devnet)...');
    try {
      const sig = await connection.requestAirdrop(pubkey, 2 * LAMPORTS_PER_SOL);
      await connection.confirmTransaction(sig, 'confirmed');
    } catch (e: any) {
      console.warn('⚠️ Airdrop failed or throttled:', e?.message ?? e);
    }
    const postBalance = await connection.getBalance(pubkey);
    if (postBalance < 1 * LAMPORTS_PER_SOL) {
      throw new Error('Insufficient SOL and airdrop failed. Fund wallet and retry.');
    }
  }
}

function loadPayerKeypair(): Keypair {
  const defaultBasalt = path.join(os.homedir(), '.config', 'solana', 'basalt.json');
  const defaultId = path.join(os.homedir(), '.config', 'solana', 'id.json');
  const env = (typeof process !== 'undefined' && (process as any).env) ? (process as any).env as Record<string, string> : {} as Record<string, string>;
  const candidate = env.SOLANA_WALLET || env.ANCHOR_WALLET || (fs.existsSync(defaultBasalt) ? defaultBasalt : defaultId);
  const raw = fs.readFileSync(candidate, 'utf-8');
  const arr = Uint8Array.from(JSON.parse(raw));
  return Keypair.fromSecretKey(arr);
}

async function main() {
  console.log('🚀 Creating USDrw mint on Devnet with protocol_config PDA authority...');

  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

  // Load payer from ~/.config/solana/basalt.json by default (or env overrides)
  const payer: Keypair = loadPayerKeypair();
  console.log('👛 Payer Wallet:', payer.publicKey.toBase58());

  const [protocolConfigPDA, protocolConfigBump] = deriveProtocolConfigPDA();

  console.log('📋 Protocol Config PDA:');
  console.log(`   Address: ${protocolConfigPDA.toBase58()}`);
  console.log(`   Bump: ${protocolConfigBump}`);
  console.log('');

  await ensureSolBalance(connection, payer.publicKey);

  console.log('🪙 Creating USDrw mint...');
  const usdrwMint = await createMint(
    connection,
    payer,
    protocolConfigPDA, // mint authority expected by on-chain program
    protocolConfigPDA, // freeze authority (optional) set to same PDA
    USDRW_DECIMALS
  );

  console.log('✅ USDrw mint created successfully!');
  console.log(`   Mint Address: ${usdrwMint.toBase58()}`);
  console.log(`   Explorer: https://explorer.solana.com/address/${usdrwMint.toBase58()}?cluster=devnet`);
  console.log('');
  console.log('ℹ️ Next steps:');
  console.log(' - Update your .env with USDRW_MINT and USDRW_DECIMALS');
  console.log(' - Initialize protocol config if not done already');
  console.log(' - Create a user USDrw ATA and test minting via the program');
}

main().catch((err) => {
  console.error('❌ Failed to create USDrw mint:', err);
});