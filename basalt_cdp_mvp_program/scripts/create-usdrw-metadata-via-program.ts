#!/usr/bin/env ts-node

import { Connection, PublicKey, Keypair, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { Program, AnchorProvider, Wallet } from '@coral-xyz/anchor';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Config
const DEVNET_RPC = 'https://api.devnet.solana.com';
const PROGRAM_ID = new PublicKey('5gzoSxVDDSjdE3pPYu9GuyaDAyV2uBXm34BvWa5epsv3');
const METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

// USDrw mint (from prior script/config)
const USDRW_MINT = new PublicKey('CbagCDjUjQNHqbf1F2bvKv4qCFrpxRaFCR6opEMbA1Jo');

// Desired metadata
const NAME = 'mUSDrw';
const SYMBOL = 'USDrw';
const URI = 'https://example.com/usdrw.json'; // Placeholder; chain stores string only

function findMetadataPda(mint: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('metadata'), METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    METADATA_PROGRAM_ID
  );
  return pda;
}

async function main() {
  console.log('🚀 Creating USDrw metadata via program CPI on devnet...');

  // Load IDL
  const idlPath = path.join(__dirname, '../target/idl/basalt_cdp_mvp.json');
  const idl = JSON.parse(fs.readFileSync(idlPath, 'utf8'));

  // Setup connection & wallet
  const connection = new Connection(DEVNET_RPC, 'confirmed');
  const walletPath = path.join(process.env.HOME!, '.config/solana/basalt.json');
  const walletKeypair = Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync(walletPath, 'utf8')))
  );
  const wallet = new Wallet(walletKeypair);
  const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });
  const program = new Program(idl, provider);

  // Derive protocol_config PDA
  const [protocolConfigPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('protocol_config')],
    PROGRAM_ID
  );

  // Derive metadata PDA
  const metadataPDA = findMetadataPda(USDRW_MINT);
  console.log('🧩 Metadata PDA:', metadataPDA.toString());

  try {
    const tx = await program.methods
      .createUsdrwMetadata(NAME, SYMBOL, URI)
      .accounts({
        owner: wallet.publicKey,
        protocolConfig: protocolConfigPDA,
        usdrwMint: USDRW_MINT,
        metadataAccount: metadataPDA,
        tokenMetadataProgram: METADATA_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY
      })
      .rpc();

    console.log('✅ Metadata created! Transaction:', tx);
    console.log('🔍 Explorer:', `https://explorer.solana.com/tx/${tx}?cluster=devnet`);
  } catch (error) {
    console.error('❌ Failed to create metadata:', error);
    process.exit(1);
  }
}

main();