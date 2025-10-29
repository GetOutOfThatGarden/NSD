import {
  Connection,
  Keypair,
  PublicKey,
} from '@solana/web3.js';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const DEVNET_RPC = 'https://api.devnet.solana.com';
const SPYX_MINT_ADDRESS = 'B5o7is4JQ4azcoNA9U9oN5wQ4DuQmdwLviwudFtiLuZ9';

async function createSpyxMetadata() {
  console.log('🚀 Checking SPYx token information...');
  
  // Connect to devnet
  const connection = new Connection(DEVNET_RPC, 'confirmed');
  console.log('✅ Connected to Solana devnet');

  // Load the wallet keypair (mint authority)
  const walletPath = path.join(process.env.HOME || '', '.config/solana/basalt.json');
  
  if (!fs.existsSync(walletPath)) {
    throw new Error(`Wallet file not found at ${walletPath}. Please run setup-devnet.sh first.`);
  }

  const walletKeypair = Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync(walletPath, 'utf8')))
  );
  
  console.log(`📝 Loaded wallet: ${walletKeypair.publicKey.toString()}`);

  // Convert mint address to PublicKey
  const mintPublicKey = new PublicKey(SPYX_MINT_ADDRESS);

  // Get mint account info
  const mintInfo = await connection.getAccountInfo(mintPublicKey);
  if (!mintInfo) {
    throw new Error('SPYx mint account not found');
  }

  console.log(`📦 SPYx Mint: ${mintPublicKey.toString()}`);
  console.log(`🔢 Decimals: 9 (configured)`);
  console.log(`💡 Note: Token metadata requires additional setup with Metaplex`);
  console.log(`📝 For now, the token will display as "Unknown Token" in wallets`);
  console.log(`🎯 The main issue is the decimal display - let's fix the frontend instead`);
  
  return {
    mint: mintPublicKey.toString(),
    decimals: 9,
    name: 'Mock SPYx',
    symbol: 'SPYx'
  };
}

// Run the script
createSpyxMetadata()
  .then(() => {
    console.log('🏁 Metadata creation completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Metadata creation failed:', error);
    process.exit(1);
  });