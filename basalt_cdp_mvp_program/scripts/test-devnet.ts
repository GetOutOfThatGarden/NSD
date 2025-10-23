import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { Program, AnchorProvider, Wallet } from '@coral-xyz/anchor';
import { createMint, getOrCreateAssociatedTokenAccount, mintTo } from '@solana/spl-token';
import { BasaltCdpMvp } from '../target/types/basalt_cdp_mvp';
import fs from 'fs';

/**
 * Comprehensive devnet testing script
 * Based on Alchemy's Solana devnet best practices
 */

// Devnet connection
const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

// Load wallet from the configured keypair
const walletKeypair = Keypair.fromSecretKey(
  new Uint8Array(JSON.parse(fs.readFileSync('/Users/user2/.config/solana/basalt.json', 'utf8')))
);
const wallet = new Wallet(walletKeypair);

// Setup provider and program
const provider = new AnchorProvider(connection, wallet, AnchorProvider.defaultOptions());
const programId = new PublicKey('YOUR_DEPLOYED_PROGRAM_ID'); // Replace with actual program ID
const program = new Program<BasaltCdpMvp>(
  JSON.parse(fs.readFileSync('./target/idl/basalt_cdp_mvp.json', 'utf8')),
  programId,
  provider
);

async function setupTestEnvironment() {
  console.log('🔧 Setting up test environment on devnet...');
  
  // 1. Check wallet balance
  const balance = await connection.getBalance(wallet.publicKey);
  console.log(`💰 Wallet balance: ${balance / 1e9} SOL`);
  
  if (balance < 1e9) { // Less than 1 SOL
    throw new Error('Insufficient SOL balance. Run: solana airdrop 2 --url https://api.devnet.solana.com');
  }
  
  // 2. Create test mints for collateral and USD_RW
  console.log('🪙 Creating test token mints...');
  
  const collateralMint = await createMint(
    connection,
    walletKeypair,
    wallet.publicKey,
    wallet.publicKey,
    9 // 9 decimals for SOL-like token
  );
  
  const usdrwMint = await createMint(
    connection,
    walletKeypair,
    wallet.publicKey,
    wallet.publicKey,
    6 // 6 decimals for USD-like token
  );
  
  console.log(`📋 Collateral Mint: ${collateralMint.toBase58()}`);
  console.log(`📋 USD_RW Mint: ${usdrwMint.toBase58()}`);
  
  // 3. Create token accounts
  const userCollateralAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    walletKeypair,
    collateralMint,
    wallet.publicKey
  );
  
  const userUsdrwAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    walletKeypair,
    usdrwMint,
    wallet.publicKey
  );
  
  // 4. Mint some collateral tokens for testing
  await mintTo(
    connection,
    walletKeypair,
    collateralMint,
    userCollateralAccount.address,
    wallet.publicKey,
    1000 * 1e9 // 1000 tokens
  );
  
  console.log('✅ Test environment setup complete!');
  
  return {
    collateralMint,
    usdrwMint,
    userCollateralAccount: userCollateralAccount.address,
    userUsdrwAccount: userUsdrwAccount.address
  };
}

async function testProtocolInitialization(collateralMint: PublicKey, usdrwMint: PublicKey) {
  console.log('🚀 Testing protocol initialization...');
  
  try {
    const [protocolConfigPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('protocol_config')],
      programId
    );
    
    const tx = await program.methods
      .initializeProtocol(collateralMint, usdrwMint)
      .accounts({
        owner: wallet.publicKey,
        protocolConfig: protocolConfigPda,
        collateralMint,
        usdrwMint,
      })
      .rpc();
    
    console.log(`✅ Protocol initialized! Transaction: ${tx}`);
    console.log(`🔍 View on explorer: https://explorer.solana.com/tx/${tx}?cluster=devnet`);
    
    return protocolConfigPda;
  } catch (error) {
    console.error('❌ Protocol initialization failed:', error);
    throw error;
  }
}

async function testMintUsdrw(
  protocolConfig: PublicKey,
  userCollateralAccount: PublicKey,
  userUsdrwAccount: PublicKey,
  usdrwMint: PublicKey
) {
  console.log('💰 Testing USD_RW minting...');
  
  try {
    const [userVaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('vault'), wallet.publicKey.toBuffer(), protocolConfig.toBuffer()],
      programId
    );
    
    const [protocolCollateralAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from('collateral_vault'), protocolConfig.toBuffer()],
      programId
    );
    
    const mintAmount = 100 * 1e9; // 100 collateral tokens
    
    const tx = await program.methods
      .mintUsdrw(new anchor.BN(mintAmount))
      .accounts({
        user: wallet.publicKey,
        protocolConfig,
        userVault: userVaultPda,
        userCollateralAccount,
        protocolCollateralAccount,
        userUsdrwAccount,
        usdrwMint,
      })
      .rpc();
    
    console.log(`✅ USD_RW minted! Transaction: ${tx}`);
    console.log(`🔍 View on explorer: https://explorer.solana.com/tx/${tx}?cluster=devnet`);
    
    return userVaultPda;
  } catch (error) {
    console.error('❌ USD_RW minting failed:', error);
    throw error;
  }
}

async function runDevnetTests() {
  try {
    console.log('🧪 Starting comprehensive devnet tests...');
    console.log(`🔗 Connected to: ${connection.rpcEndpoint}`);
    console.log(`👤 Testing with wallet: ${wallet.publicKey.toBase58()}`);
    
    // Setup test environment
    const { collateralMint, usdrwMint, userCollateralAccount, userUsdrwAccount } = 
      await setupTestEnvironment();
    
    // Test protocol initialization
    const protocolConfig = await testProtocolInitialization(collateralMint, usdrwMint);
    
    // Test minting
    const userVault = await testMintUsdrw(
      protocolConfig,
      userCollateralAccount,
      userUsdrwAccount,
      usdrwMint
    );
    
    console.log('🎉 All devnet tests passed!');
    console.log('\n📊 Test Results Summary:');
    console.log(`✅ Protocol Config: ${protocolConfig.toBase58()}`);
    console.log(`✅ User Vault: ${userVault.toBase58()}`);
    console.log(`✅ Collateral Mint: ${collateralMint.toBase58()}`);
    console.log(`✅ USD_RW Mint: ${usdrwMint.toBase58()}`);
    
  } catch (error) {
    console.error('❌ Devnet tests failed:', error);
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runDevnetTests();
}