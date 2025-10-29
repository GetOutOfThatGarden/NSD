import {
  Connection,
  Keypair,
  PublicKey,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_PROGRAM_ID,
  getAccount,
} from '@solana/spl-token';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const DEVNET_RPC = 'https://api.devnet.solana.com';
const SPYX_MINT_ADDRESS = 'B5o7is4JQ4azcoNA9U9oN5wQ4DuQmdwLviwudFtiLuZ9';
const USER_WALLET_ADDRESS = '8pFrtqrPsPGdjDfQbCQtxtrRykYJUQtZWzY6YFaWZUMN';
const MINT_AMOUNT = 15; // 15 SPYx tokens
const SPYX_DECIMALS = 9;

async function mintSpyxToUser() {
  console.log('🚀 Starting SPYx token minting process...');
  
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

  // Check wallet balance
  const balance = await connection.getBalance(walletKeypair.publicKey);
  console.log(`💰 Wallet balance: ${balance / LAMPORTS_PER_SOL} SOL`);
  
  if (balance < 0.1 * LAMPORTS_PER_SOL) {
    throw new Error('Insufficient SOL balance. Please run setup-devnet.sh to get devnet SOL.');
  }

  // Convert addresses to PublicKey objects
  const spyxMint = new PublicKey(SPYX_MINT_ADDRESS);
  const userWallet = new PublicKey(USER_WALLET_ADDRESS);

  console.log(`🎯 Target wallet: ${userWallet.toString()}`);
  console.log(`🪙 SPYx mint: ${spyxMint.toString()}`);

  try {
    // Get or create associated token account for the user
    console.log('🔍 Getting or creating associated token account...');
    const userTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      walletKeypair, // Payer
      spyxMint,      // Mint
      userWallet     // Owner
    );

    console.log(`📦 User token account: ${userTokenAccount.address.toString()}`);

    // Check current balance
    try {
      const currentBalance = await getAccount(connection, userTokenAccount.address);
      console.log(`📊 Current SPYx balance: ${Number(currentBalance.amount) / Math.pow(10, SPYX_DECIMALS)} SPYx`);
    } catch (error) {
      console.log('📊 Current SPYx balance: 0 SPYx (new account)');
    }

    // Mint tokens to the user's account
    console.log(`🏭 Minting ${MINT_AMOUNT} SPYx tokens...`);
    const mintAmount = MINT_AMOUNT * Math.pow(10, SPYX_DECIMALS); // Convert to smallest unit

    const signature = await mintTo(
      connection,
      walletKeypair,           // Payer
      spyxMint,                // Mint
      userTokenAccount.address, // Destination
      walletKeypair,           // Mint authority
      mintAmount               // Amount
    );

    console.log(`✅ Minting successful!`);
    console.log(`📝 Transaction signature: ${signature}`);
    console.log(`🔗 View on Solana Explorer: https://explorer.solana.com/tx/${signature}?cluster=devnet`);

    // Verify the new balance
    const updatedAccount = await getAccount(connection, userTokenAccount.address);
    const newBalance = Number(updatedAccount.amount) / Math.pow(10, SPYX_DECIMALS);
    console.log(`🎉 New SPYx balance: ${newBalance} SPYx`);

    console.log('\n🎯 Summary:');
    console.log(`   • Minted: ${MINT_AMOUNT} SPYx`);
    console.log(`   • To wallet: ${userWallet.toString()}`);
    console.log(`   • Token account: ${userTokenAccount.address.toString()}`);
    console.log(`   • Total balance: ${newBalance} SPYx`);
    console.log('\n✅ Ready to test the frontend!');

  } catch (error) {
    console.error('❌ Error during minting process:', error);
    throw error;
  }
}

// Run the script
mintSpyxToUser()
  .then(() => {
    console.log('🏁 Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });