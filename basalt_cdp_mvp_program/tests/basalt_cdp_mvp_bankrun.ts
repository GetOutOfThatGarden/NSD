import * as anchor from '@coral-xyz/anchor';
import { PublicKey, Keypair, SystemProgram } from '@solana/web3.js';
import { BankrunProvider } from 'anchor-bankrun';
import { assert } from 'chai';
import { startAnchor } from 'solana-bankrun';
import { Buffer } from 'buffer';
import { createInitializeMint2Instruction, MINT_SIZE, TOKEN_PROGRAM_ID } from '@solana/spl-token';

import idl from '../target/idl/basalt_cdp_mvp.json';
const PROGRAM_ID = new PublicKey((idl as any).address);

// Normalize IDL: ensure top-level address and map types to Anchor expectations
function normalizeIdl(original: any): any {
  const clone = JSON.parse(JSON.stringify(original));
  // Ensure address
  clone.address = original.address ?? clone.metadata?.address;
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

async function fundAccountBankrun(
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

    // Use the bankrun payer as wallet to cover fees
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

    // Use two-arg Program constructor with normalized IDL
    program = new anchor.Program(idlNormalized as unknown as anchor.Idl, provider as any);

    // Derive PDAs
    [protocolConfig] = PublicKey.findProgramAddressSync(
      [Buffer.from('protocol_config')],
      program.programId
    );
  });

  it('initializes protocol successfully', async () => {
    const collateralMint = await createMintBankrun(
      provider,
      context.payer,
      context.payer.publicKey,
      context.payer.publicKey,
      9
    );
    const usdrwMint = await createMintBankrun(
      provider,
      context.payer,
      context.payer.publicKey,
      context.payer.publicKey,
      6
    );

    // Fund owner to pay rent for protocol_config init
    await fundAccountBankrun(provider, context.payer, owner.publicKey, 1_000_000_000);

    const sig = await (program as any).methods
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

    assert.isString(sig);

    const cfg = await (program as any).account.protocolConfig.fetch(protocolConfig);
    assert.strictEqual(cfg.owner.toBase58(), owner.publicKey.toBase58());
    assert.strictEqual(cfg.collateralMint.toBase58(), collateralMint.toBase58());
    assert.strictEqual(cfg.usdrwMint.toBase58(), usdrwMint.toBase58());
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