import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { Program, AnchorProvider, Wallet, BN, Idl } from '@coral-xyz/anchor';
import { createMint, getOrCreateAssociatedTokenAccount, mintTo } from '@solana/spl-token';
// IDL will be fetched from chain to avoid Node-specific imports/types

/**
 * Comprehensive devnet testing script
 * Based on Alchemy's Solana devnet best practices
 */

// Devnet connection
const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

// Use Anchor's local wallet (id.json) via env(), then reuse it on devnet
const baseProvider = AnchorProvider.env();
const wallet = baseProvider.wallet as Wallet;
const walletKeypair: Keypair = (wallet as any).payer as Keypair;

// Setup provider and program (program initialized lazily after fetching IDL)
const provider = new AnchorProvider(connection, wallet, AnchorProvider.defaultOptions());
const programId = new PublicKey('5gzoSxVDDSjdE3pPYu9GuyaDAyV2uBXm34BvWa5epsv3');

// Token configuration - SPYx mock mint for testing
const SPYX_MOCK_MINT = new PublicKey('B5o7is4JQ4azcoNA9U9oN5wQ4DuQmdwLviwudFtiLuZ9');

let program: any;

async function initProgram() {
  const idl = await Program.fetchIdl(programId, provider);
  if (!idl) {
    throw new Error('IDL not found on-chain. Build and deploy the program, or provide local IDL.');
  }
  program = new Program(idl as Idl, programId, provider) as any;
}

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
  
  // Note: For production testing, use SPYX_MOCK_MINT: B5o7is4JQ4azcoNA9U9oN5wQ4DuQmdwLviwudFtiLuZ9
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
      [new TextEncoder().encode('protocol_config')],
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

async function initializeProtocolCollateralVault(
  protocolConfig: PublicKey,
  collateralMint: PublicKey
) {
  console.log('🏗️  Initializing protocol collateral vault (PDA token account)...');

  try {
    const [protocolCollateralAccount] = PublicKey.findProgramAddressSync(
      [new TextEncoder().encode('collateral_vault'), protocolConfig.toBuffer()],
      programId
    );

    const tx = await program.methods
      .initializeCollateralVault()
      .accounts({
        owner: wallet.publicKey,
        protocolConfig,
        collateralMint,
        protocolCollateralAccount,
        // token and system programs are auto-inferred
      })
      .rpc();

    console.log(`✅ Collateral vault initialized! Transaction: ${tx}`);
    console.log(`🔍 View on explorer: https://explorer.solana.com/tx/${tx}?cluster=devnet`);

    return protocolCollateralAccount;
  } catch (error) {
    console.error('❌ Collateral vault initialization failed:', error);
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
      [new TextEncoder().encode('vault'), wallet.publicKey.toBuffer(), protocolConfig.toBuffer()],
      programId
    );
    
    const [protocolCollateralAccount] = PublicKey.findProgramAddressSync(
      [new TextEncoder().encode('collateral_vault'), protocolConfig.toBuffer()],
      programId
    );
    
    const mintAmount = 100 * 1e9; // 100 collateral tokens
    
    const tx = await program.methods
      .mintUsdrw(new BN(mintAmount))
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
    await initProgram();
    
    // Setup test environment
    const { collateralMint, usdrwMint, userCollateralAccount, userUsdrwAccount } = 
      await setupTestEnvironment();
    
    // Test protocol initialization
    const protocolConfig = await testProtocolInitialization(collateralMint, usdrwMint);
    // Initialize the protocol's collateral vault PDA token account
    await initializeProtocolCollateralVault(protocolConfig, collateralMint);
    
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
    throw error;
  }
}

// Run tests
runDevnetTests().catch(() => {});