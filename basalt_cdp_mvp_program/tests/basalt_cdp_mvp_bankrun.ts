import * as anchor from '@coral-xyz/anchor';
import { PublicKey, Keypair, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { BankrunProvider } from 'anchor-bankrun';
import { assert } from 'chai';
import { startAnchor } from 'solana-bankrun';
import { Buffer } from 'buffer';

import idl from '../target/idl/basalt_cdp_mvp.json';
const PROGRAM_ID = new PublicKey((idl as any).metadata.address);

// Normalize IDL: ensure top-level address and map types to Anchor expectations
function normalizeIdl(original: any): any {
  const clone = JSON.parse(JSON.stringify(original));
  // Ensure address
  clone.address = clone.metadata?.address;
  // Normalize instruction arg types
  if (Array.isArray(clone.instructions)) {
    for (const ix of clone.instructions) {
      if (Array.isArray(ix.args)) {
        for (const arg of ix.args) {
          if (arg.type === 'publicKey') arg.type = 'pubkey';
        }
      }
    }
  }
  // Normalize account field types
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

describe('Basalt CDP MVP - Bankrun Tests', () => {
  let context: any;
  let provider: BankrunProvider;
  let program: anchor.Program<any>;
  let owner: Keypair;
  let user: Keypair;
  let protocolConfig: PublicKey;

  before(async () => {
    // Start Bankrun with our program from the current workspace
    context = await startAnchor('.', [{ name: 'basalt_cdp_mvp', programId: PROGRAM_ID }], []);
    provider = new BankrunProvider(context);
    anchor.setProvider(provider);

    // Create test keypairs
    owner = Keypair.generate();
    user = Keypair.generate();

    // Attach a minimal wallet to provider for default account resolution
    (provider as any).wallet = {
      publicKey: owner.publicKey,
      signTransaction: async (tx: any) => tx,
      signAllTransactions: async (txs: any[]) => txs,
    };

    // Use two-arg Program constructor with normalized IDL
    program = new anchor.Program(idlNormalized as unknown as anchor.Idl, provider as any);

    // Airdrop SOL to test accounts
    await context.banksClient.requestAirdrop(owner.publicKey, 10n * BigInt(LAMPORTS_PER_SOL));
    await context.banksClient.requestAirdrop(user.publicKey, 10n * BigInt(LAMPORTS_PER_SOL));

    // Derive PDAs
    [protocolConfig] = PublicKey.findProgramAddressSync(
      [Buffer.from('protocol_config')],
      program.programId
    );
  });

  it('initializes protocol', async () => {
    const collateralMint = Keypair.generate().publicKey;
    const usdrwMint = Keypair.generate().publicKey;

    const tx = await (program as any).methods
      .initializeProtocol(collateralMint, usdrwMint)
      .accounts({
        owner: owner.publicKey,
        protocolConfig,
        systemProgram: SystemProgram.programId,
      })
      .signers([owner])
      .rpc();

    console.log('Initialize protocol transaction signature:', tx);

    const cfg = await (program.account as any)["protocolConfig"].fetch(protocolConfig);
    assert.equal(cfg.owner.toString(), owner.publicKey.toString());
    assert.equal(cfg.collateralMint.toString(), collateralMint.toString());
    assert.equal(cfg.usdrwMint.toString(), usdrwMint.toString());
  });

  it('prevents re-initialization', async () => {
    try {
      const collateralMint = Keypair.generate().publicKey;
      const usdrwMint = Keypair.generate().publicKey;

      await (program as any).methods
        .initializeProtocol(collateralMint, usdrwMint)
        .accounts({
          owner: owner.publicKey,
          protocolConfig,
          systemProgram: SystemProgram.programId,
        })
        .signers([owner])
        .rpc();

      assert.fail('Expected initialization to fail on the second attempt');
    } catch (error: any) {
      // Expect a custom program error or address-in-use
      assert.isTrue(
        (error.message || '').includes('already in use') ||
        (error.message || '').includes('custom program error')
      );
    }
  });

  it('supports time travel (Bankrun feature)', async () => {
    const currentSlot = await context.banksClient.getSlot();
    console.log('Current slot:', currentSlot);

    await context.warpToSlot(currentSlot + 100n);

    const newSlot = await context.banksClient.getSlot();
    console.log('New slot after time travel:', newSlot);

    assert.isTrue(newSlot > currentSlot);
  });
});