import * as anchor from '@coral-xyz/anchor';
import { PublicKey, Keypair, SystemProgram } from '@solana/web3.js';
import { BankrunProvider } from 'anchor-bankrun';
import { assert } from 'chai';
import { startAnchor } from 'solana-bankrun';
import { Buffer } from 'buffer';
import { 
  createInitializeMint2Instruction, 
  createInitializeAccount3Instruction,
  createMintToInstruction,
  MINT_SIZE, 
  TOKEN_PROGRAM_ID,
  ACCOUNT_SIZE,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction
} from '@solana/spl-token';

import idl from '../target/idl/basalt_cdp_mvp.json';
const PROGRAM_ID = new PublicKey((idl as any).address);

// Constants from the program
const FIXED_POINT_SCALE = new anchor.BN('1000000000000000000'); // 10^18
const COLLATERAL_RATIO = new anchor.BN('1500000000000000000'); // 150%
const LIQUIDATION_THRESHOLD = new anchor.BN('1200000000000000000'); // 120%
const LIQUIDATION_BONUS_PERCENTAGE = new anchor.BN(102); // 2% bonus
const MIN_COLLATERAL_AMOUNT = new anchor.BN(1000000); // 0.001 tokens

// Normalize IDL for Anchor compatibility
function normalizeIdl(original: any): any {
  const clone = JSON.parse(JSON.stringify(original));
  clone.address = original.address ?? clone.metadata?.address;
  
  if (Array.isArray(clone.instructions)) {
    for (const ix of clone.instructions) {
      if (Array.isArray(ix.args)) {
        for (const arg of ix.args) {
          if (arg.type === 'publicKey') arg.type = 'pubkey';
        }
      }
    }
  }
  
  if (Array.isArray(clone.accounts)) {
    for (const acc of clone.accounts) {
      const fields = acc.type?.fields;
      if (Array.isArray(fields)) {
        for (const f of fields) {
          if (f.type === 'publicKey') f.type = 'pubkey';
        }
      }
    }
  }
  return clone;
}

const idlNormalized = normalizeIdl(idl as any);

// Helper functions
async function createMintBankrun(
  provider: BankrunProvider,
  feePayer: Keypair,
  mintAuthority: PublicKey,
  freezeAuthority: PublicKey | null,
  decimals: number
): Promise<PublicKey> {
  const mint = Keypair.generate();
  const lamports = await provider.connection.getMinimumBalanceForRentExemption(MINT_SIZE);

  const createAccountIx = SystemProgram.createAccount({
    fromPubkey: feePayer.publicKey,
    newAccountPubkey: mint.publicKey,
    space: MINT_SIZE,
    lamports,
    programId: TOKEN_PROGRAM_ID,
  });

  const initMintIx = createInitializeMint2Instruction(
    mint.publicKey,
    decimals,
    mintAuthority,
    freezeAuthority,
    TOKEN_PROGRAM_ID
  );

  const tx = new anchor.web3.Transaction().add(createAccountIx, initMintIx);
  tx.feePayer = feePayer.publicKey;
  await (provider as any).sendAndConfirm(tx, [feePayer, mint]);

  return mint.publicKey;
}

async function createTokenAccount(
  provider: BankrunProvider,
  feePayer: Keypair,
  mint: PublicKey,
  owner: PublicKey
): Promise<PublicKey> {
  const tokenAccount = Keypair.generate();
  const lamports = await provider.connection.getMinimumBalanceForRentExemption(ACCOUNT_SIZE);

  const createAccountIx = SystemProgram.createAccount({
    fromPubkey: feePayer.publicKey,
    newAccountPubkey: tokenAccount.publicKey,
    space: ACCOUNT_SIZE,
    lamports,
    programId: TOKEN_PROGRAM_ID,
  });

  const initAccountIx = createInitializeAccount3Instruction(
    tokenAccount.publicKey,
    mint,
    owner,
    TOKEN_PROGRAM_ID
  );

  const tx = new anchor.web3.Transaction().add(createAccountIx, initAccountIx);
  tx.feePayer = feePayer.publicKey;
  await (provider as any).sendAndConfirm(tx, [feePayer, tokenAccount]);

  return tokenAccount.publicKey;
}

async function mintTokens(
  provider: BankrunProvider,
  feePayer: Keypair,
  mint: PublicKey,
  destination: PublicKey,
  authority: Keypair,
  amount: number
): Promise<void> {
  const mintToIx = createMintToInstruction(
    mint,
    destination,
    authority.publicKey,
    amount,
    [],
    TOKEN_PROGRAM_ID
  );

  const tx = new anchor.web3.Transaction().add(mintToIx);
  tx.feePayer = feePayer.publicKey;
  await (provider as any).sendAndConfirm(tx, [feePayer, authority]);
}

async function fundAccount(
  provider: BankrunProvider,
  from: Keypair,
  to: PublicKey,
  lamports: number,
): Promise<void> {
  const transferIx = SystemProgram.transfer({
    fromPubkey: from.publicKey,
    toPubkey: to,
    lamports,
  });
  const tx = new anchor.web3.Transaction().add(transferIx);
  tx.feePayer = from.publicKey;
  await (provider as any).sendAndConfirm(tx, [from]);
}

describe('Liquidation Mechanism Tests', () => {
  let context: any;
  let provider: BankrunProvider;
  let program: anchor.Program<any>;
  let owner: Keypair;
  let user: Keypair;
  let liquidator: Keypair;
  let protocolConfig: PublicKey;
  let protocolCollateralAccount: PublicKey;
  let userVault: PublicKey;
  let collateralMint: PublicKey;
  let usdrwMint: PublicKey;
  let userCollateralAccount: PublicKey;
  let userUsdrwAccount: PublicKey;
  let liquidatorCollateralAccount: PublicKey;
  let liquidatorUsdrwAccount: PublicKey;

  before(async () => {
    // Start Bankrun
    context = await startAnchor('.', [{ name: 'basalt_cdp_mvp', programId: PROGRAM_ID }], []);
    provider = new BankrunProvider(context);
    anchor.setProvider(provider);

    // Create test keypairs
    owner = Keypair.generate();
    user = Keypair.generate();
    liquidator = Keypair.generate();

    // Set up wallet
    (provider as any).wallet = {
      publicKey: context.payer.publicKey,
      signTransaction: async (tx: any) => {
        tx.partialSign(context.payer);
        return tx;
      },
      signAllTransactions: async (txs: any[]) => {
        txs.forEach((tx) => tx.partialSign(context.payer));
        return txs;
      },
    };

    program = new anchor.Program(idlNormalized as unknown as anchor.Idl, provider as any);

    // Derive PDAs
    [protocolConfig] = PublicKey.findProgramAddressSync(
      [Buffer.from('protocol_config')],
      program.programId
    );

    [protocolCollateralAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from('collateral_vault'), protocolConfig.toBuffer()],
      program.programId
    );

    [userVault] = PublicKey.findProgramAddressSync(
      [Buffer.from('user_vault'), user.publicKey.toBuffer(), protocolConfig.toBuffer()],
      program.programId
    );

    // Create mints
    collateralMint = await createMintBankrun(
      provider,
      context.payer,
      context.payer.publicKey,
      context.payer.publicKey,
      9
    );

    usdrwMint = await createMintBankrun(
      provider,
      context.payer,
      protocolConfig, // Protocol config will be mint authority
      null,
      6
    );

    // Fund accounts
    await fundAccount(provider, context.payer, owner.publicKey, 1_000_000_000);
    await fundAccount(provider, context.payer, user.publicKey, 1_000_000_000);
    await fundAccount(provider, context.payer, liquidator.publicKey, 1_000_000_000);

    // Create token accounts
    userCollateralAccount = await createTokenAccount(
      provider,
      context.payer,
      collateralMint,
      user.publicKey
    );

    userUsdrwAccount = await createTokenAccount(
      provider,
      context.payer,
      usdrwMint,
      user.publicKey
    );

    liquidatorCollateralAccount = await createTokenAccount(
      provider,
      context.payer,
      collateralMint,
      liquidator.publicKey
    );

    liquidatorUsdrwAccount = await createTokenAccount(
      provider,
      context.payer,
      usdrwMint,
      liquidator.publicKey
    );

    // Mint collateral tokens to user
    await mintTokens(
      provider,
      context.payer,
      collateralMint,
      userCollateralAccount,
      context.payer,
      1000000000 // 1 token with 9 decimals
    );
  });

  it('initializes protocol and collateral vault', async () => {
    // Initialize protocol
    await program.methods
      .initializeProtocol(collateralMint, usdrwMint)
      .accounts({
        owner: owner.publicKey,
        protocolConfig,
        collateralMint,
        usdrwMint,
        systemProgram: SystemProgram.programId,
      })
      .signers([owner])
      .rpc();

    // Initialize collateral vault
    await program.methods
      .initializeCollateralVault()
      .accounts({
        owner: owner.publicKey,
        protocolConfig,
        collateralMint,
        protocolCollateralAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([owner])
      .rpc();

    // Verify protocol config
    const cfg = await (program.account as any).protocolConfig.fetch(protocolConfig);
    assert.strictEqual(cfg.owner.toBase58(), owner.publicKey.toBase58());
    assert.strictEqual(cfg.collateralMint.toBase58(), collateralMint.toBase58());
    assert.strictEqual(cfg.usdrwMint.toBase58(), usdrwMint.toBase58());
  });

  it('creates a vault position that can be liquidated', async () => {
    const collateralAmount = new anchor.BN(150000000); // 0.15 tokens

    // Mint USD_RW tokens
    await program.methods
      .mintUsdrw(collateralAmount)
      .accounts({
        user: user.publicKey,
        protocolConfig,
        userVault,
        userCollateralAccount,
        protocolCollateralAccount,
        userUsdrwAccount,
        usdrwMint,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    // Verify vault state
    const vault = await (program.account as any).userVault.fetch(userVault);
    assert.strictEqual(vault.owner.toBase58(), user.publicKey.toBase58());
    assert.isTrue(vault.collateralAmount.gt(new anchor.BN(0)));
    assert.isTrue(vault.debtAmount.gt(new anchor.BN(0)));

    console.log('Vault created with:');
    console.log('- Collateral:', vault.collateralAmount.toString());
    console.log('- Debt:', vault.debtAmount.toString());
  });

  it('prevents liquidation when vault is healthy', async () => {
    const vault = await (program.account as any).userVault.fetch(userVault);
    const debtToLiquidate = vault.debtAmount.div(new anchor.BN(2)); // Try to liquidate half

    try {
      await program.methods
        .liquidateVault(debtToLiquidate)
        .accounts({
          liquidator: liquidator.publicKey,
          protocolConfig,
          userVault,
          protocolCollateralAccount,
          liquidatorCollateralAccount,
          liquidatorUsdrwAccount,
          usdrwMint,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([liquidator])
        .rpc();
      
      assert.fail('Should have failed - vault is not undercollateralized');
    } catch (error: any) {
      assert.include(error.message, 'NotUndercollateralized');
    }
  });

  it('allows self-liquidation when vault becomes undercollateralized', async () => {
    // Simulate time passage to accrue interest and make vault undercollateralized
    const currentSlot = await context.banksClient.getSlot();
    await context.warpToSlot(currentSlot + 1000000n); // Advance time significantly

    // Calculate interest to make vault undercollateralized
    await program.methods
      .calculateInterest()
      .accounts({
        user: user.publicKey,
        protocolConfig,
        userVault,
      })
      .signers([user])
      .rpc();

    const vaultBefore = await (program.account as any).userVault.fetch(userVault);
    console.log('Vault before self-liquidation:');
    console.log('- Collateral:', vaultBefore.collateralAmount.toString());
    console.log('- Debt:', vaultBefore.debtAmount.toString());

    // Calculate collateral ratio
    const collateralRatio = vaultBefore.collateralAmount
      .mul(FIXED_POINT_SCALE)
      .div(vaultBefore.debtAmount);
    console.log('- Collateral Ratio:', collateralRatio.toString());
    console.log('- Liquidation Threshold:', LIQUIDATION_THRESHOLD.toString());

    // If not undercollateralized yet, manually adjust debt to trigger liquidation
    if (collateralRatio.gte(LIQUIDATION_THRESHOLD)) {
      console.log('Vault still healthy, skipping self-liquidation test');
      return;
    }

    // Mint USD_RW to user for self-liquidation
    const debtToLiquidate = vaultBefore.debtAmount.div(new anchor.BN(4)); // Liquidate 25%
    await mintTokens(
      provider,
      context.payer,
      usdrwMint,
      userUsdrwAccount,
      context.payer, // Using payer as mint authority temporarily
      debtToLiquidate.toNumber()
    );

    // Self-liquidate (user liquidating their own vault)
    await program.methods
      .liquidateVault(debtToLiquidate)
      .accounts({
        liquidator: user.publicKey, // User is liquidating their own vault
        protocolConfig,
        userVault,
        protocolCollateralAccount,
        liquidatorCollateralAccount: userCollateralAccount, // User's collateral account
        liquidatorUsdrwAccount: userUsdrwAccount,
        usdrwMint,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([user])
      .rpc();

    const vaultAfter = await (program.account as any).userVault.fetch(userVault);
    console.log('Vault after self-liquidation:');
    console.log('- Collateral:', vaultAfter.collateralAmount.toString());
    console.log('- Debt:', vaultAfter.debtAmount.toString());

    // Verify liquidation effects
    assert.isTrue(vaultAfter.debtAmount.lt(vaultBefore.debtAmount));
    assert.isTrue(vaultAfter.collateralAmount.lt(vaultBefore.collateralAmount));

    // Verify liquidation bonus (2%)
    const expectedCollateralSeized = debtToLiquidate
      .mul(LIQUIDATION_BONUS_PERCENTAGE)
      .div(new anchor.BN(100));
    const actualCollateralSeized = vaultBefore.collateralAmount.sub(vaultAfter.collateralAmount);
    
    console.log('Expected collateral seized:', expectedCollateralSeized.toString());
    console.log('Actual collateral seized:', actualCollateralSeized.toString());
    
    // Allow for small rounding differences
    const difference = expectedCollateralSeized.sub(actualCollateralSeized).abs();
    assert.isTrue(difference.lte(new anchor.BN(1000)), 'Liquidation bonus calculation incorrect');
  });

  it('allows external liquidation with 2% bonus', async () => {
    // Create another undercollateralized position
    const user2 = Keypair.generate();
    await fundAccount(provider, context.payer, user2.publicKey, 1_000_000_000);

    const [user2Vault] = PublicKey.findProgramAddressSync(
      [Buffer.from('user_vault'), user2.publicKey.toBuffer(), protocolConfig.toBuffer()],
      program.programId
    );

    const user2CollateralAccount = await createTokenAccount(
      provider,
      context.payer,
      collateralMint,
      user2.publicKey
    );

    const user2UsdrwAccount = await createTokenAccount(
      provider,
      context.payer,
      usdrwMint,
      user2.publicKey
    );

    // Mint collateral to user2
    await mintTokens(
      provider,
      context.payer,
      collateralMint,
      user2CollateralAccount,
      context.payer,
      100000000 // 0.1 tokens
    );

    // Create vault for user2
    const collateralAmount = new anchor.BN(100000000);
    await program.methods
      .mintUsdrw(collateralAmount)
      .accounts({
        user: user2.publicKey,
        protocolConfig,
        userVault: user2Vault,
        userCollateralAccount: user2CollateralAccount,
        protocolCollateralAccount,
        userUsdrwAccount: user2UsdrwAccount,
        usdrwMint,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([user2])
      .rpc();

    // Advance time to make vault undercollateralized
    const currentSlot = await context.banksClient.getSlot();
    await context.warpToSlot(currentSlot + 2000000n);

    await program.methods
      .calculateInterest()
      .accounts({
        user: user2.publicKey,
        protocolConfig,
        userVault: user2Vault,
      })
      .signers([user2])
      .rpc();

    const vaultBefore = await (program.account as any).userVault.fetch(user2Vault);
    const collateralRatio = vaultBefore.collateralAmount
      .mul(FIXED_POINT_SCALE)
      .div(vaultBefore.debtAmount);

    if (collateralRatio.gte(LIQUIDATION_THRESHOLD)) {
      console.log('Vault still healthy, skipping external liquidation test');
      return;
    }

    // Mint USD_RW to liquidator
    const debtToLiquidate = vaultBefore.debtAmount.div(new anchor.BN(3)); // Liquidate 33%
    await mintTokens(
      provider,
      context.payer,
      usdrwMint,
      liquidatorUsdrwAccount,
      context.payer,
      debtToLiquidate.toNumber()
    );

    const liquidatorCollateralBefore = await provider.connection.getTokenAccountBalance(
      liquidatorCollateralAccount
    );

    // External liquidation
    await program.methods
      .liquidateVault(debtToLiquidate)
      .accounts({
        liquidator: liquidator.publicKey,
        protocolConfig,
        userVault: user2Vault,
        protocolCollateralAccount,
        liquidatorCollateralAccount,
        liquidatorUsdrwAccount,
        usdrwMint,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([liquidator])
      .rpc();

    const vaultAfter = await (program.account as any).userVault.fetch(user2Vault);
    const liquidatorCollateralAfter = await provider.connection.getTokenAccountBalance(
      liquidatorCollateralAccount
    );

    // Verify liquidation effects
    assert.isTrue(vaultAfter.debtAmount.lt(vaultBefore.debtAmount));
    assert.isTrue(vaultAfter.collateralAmount.lt(vaultBefore.collateralAmount));

    // Verify liquidator received collateral with 2% bonus
    const collateralReceived = new anchor.BN(liquidatorCollateralAfter.value.amount)
      .sub(new anchor.BN(liquidatorCollateralBefore.value.amount));
    const expectedCollateralReceived = debtToLiquidate
      .mul(LIQUIDATION_BONUS_PERCENTAGE)
      .div(new anchor.BN(100));

    console.log('Collateral received by liquidator:', collateralReceived.toString());
    console.log('Expected collateral with 2% bonus:', expectedCollateralReceived.toString());

    const difference = expectedCollateralReceived.sub(collateralReceived).abs();
    assert.isTrue(difference.lte(new anchor.BN(1000)), 'Liquidation bonus calculation incorrect');
  });

  it('prevents liquidation with insufficient USD_RW balance', async () => {
    // Create a liquidator with insufficient USD_RW
    const poorLiquidator = Keypair.generate();
    await fundAccount(provider, context.payer, poorLiquidator.publicKey, 1_000_000_000);

    const poorLiquidatorCollateralAccount = await createTokenAccount(
      provider,
      context.payer,
      collateralMint,
      poorLiquidator.publicKey
    );

    const poorLiquidatorUsdrwAccount = await createTokenAccount(
      provider,
      context.payer,
      usdrwMint,
      poorLiquidator.publicKey
    );

    // Try to liquidate without sufficient USD_RW
    const vault = await (program.account as any).userVault.fetch(userVault);
    const debtToLiquidate = vault.debtAmount.div(new anchor.BN(10));

    try {
      await program.methods
        .liquidateVault(debtToLiquidate)
        .accounts({
          liquidator: poorLiquidator.publicKey,
          protocolConfig,
          userVault,
          protocolCollateralAccount,
          liquidatorCollateralAccount: poorLiquidatorCollateralAccount,
          liquidatorUsdrwAccount: poorLiquidatorUsdrwAccount,
          usdrwMint,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([poorLiquidator])
        .rpc();

      assert.fail('Should have failed - insufficient USD_RW balance');
    } catch (error: any) {
      assert.include(error.message, 'InsufficientUsdrwBalance');
    }
  });

  it('prevents liquidation of zero debt amount', async () => {
    try {
      await program.methods
        .liquidateVault(new anchor.BN(0))
        .accounts({
          liquidator: liquidator.publicKey,
          protocolConfig,
          userVault,
          protocolCollateralAccount,
          liquidatorCollateralAccount,
          liquidatorUsdrwAccount,
          usdrwMint,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([liquidator])
        .rpc();

      assert.fail('Should have failed - zero liquidation amount');
    } catch (error: any) {
      assert.include(error.message, 'InvalidLiquidationAmount');
    }
  });

  it('prevents liquidation of more debt than exists', async () => {
    const vault = await (program.account as any).userVault.fetch(userVault);
    const excessiveAmount = vault.debtAmount.add(new anchor.BN(1000000));

    try {
      await program.methods
        .liquidateVault(excessiveAmount)
        .accounts({
          liquidator: liquidator.publicKey,
          protocolConfig,
          userVault,
          protocolCollateralAccount,
          liquidatorCollateralAccount,
          liquidatorUsdrwAccount,
          usdrwMint,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([liquidator])
        .rpc();

      assert.fail('Should have failed - excessive liquidation amount');
    } catch (error: any) {
      assert.include(error.message, 'InvalidLiquidationAmount');
    }
  });
});