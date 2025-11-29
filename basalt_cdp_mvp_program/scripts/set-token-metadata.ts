import fs from 'fs';
import os from 'os';
import path from 'path';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { createSignerFromKeypair, signerIdentity, publicKey as umiPublicKey } from '@metaplex-foundation/umi';
import { mplTokenMetadata, findMetadataPda, createMetadataAccountV3, updateMetadataAccountV2 } from '@metaplex-foundation/mpl-token-metadata';

// Devnet RPC
const DEVNET_RPC = 'https://api.devnet.solana.com';

// Mint addresses (as base58)
const SPYX_MINT = 'B5o7is4JQ4azcoNA9U9oN5wQ4DuQmdwLviwudFtiLuZ9';
// Prefer .env USDRW_MINT if set, otherwise fallback to init-protocol.ts constant
const FALLBACK_USDRW = 'CbagCDjUjQNHqbf1F2bvKv4qCFrpxRaFCR6opEMbA1Jo';

function resolveUsdrwMintString(): string {
  try {
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const contents = fs.readFileSync(envPath, 'utf-8');
      const match = contents.match(/USDRW_MINT\s*=\s*([^\n]+)/);
      if (match && match[1]) {
        const addr = match[1].trim();
        if (addr) return addr;
      }
    }
  } catch {}
  return FALLBACK_USDRW;
}

function loadSecret(): Uint8Array {
  const defaultBasalt = path.join(os.homedir(), '.config', 'solana', 'basalt.json');
  const defaultId = path.join(os.homedir(), '.config', 'solana', 'id.json');
  const candidate = fs.existsSync(defaultBasalt) ? defaultBasalt : defaultId;
  const raw = fs.readFileSync(candidate, 'utf-8');
  return Uint8Array.from(JSON.parse(raw));
}

async function createOrUpdateMetadataUmi(
  umi: ReturnType<typeof createUmi>,
  mintBase58: string,
  name: string,
  symbol: string,
  uri: string
) {
  const mint = umiPublicKey(mintBase58);
  const metadata = findMetadataPda(umi, { mint });

  // Try create first; if it exists, attempt update.
  try {
    const builder = createMetadataAccountV3(umi, {
      metadata,
      mint,
      mintAuthority: umi.identity,
      payer: umi.identity,
      updateAuthority: umi.identity,
      data: {
        name,
        symbol,
        uri,
        sellerFeeBasisPoints: 0,
        creators: null,
        collection: null,
        uses: null,
      },
      isMutable: true,
      collectionDetails: null,
    });
    const sig = await builder.sendAndConfirm(umi);
    return { signature: sig, created: true };
  } catch (e) {
    const builder = updateMetadataAccountV2(umi, {
      metadata,
      updateAuthority: umi.identity,
      data: {
        name,
        symbol,
        uri,
        sellerFeeBasisPoints: 0,
        creators: null,
        collection: null,
        uses: null,
      },
      primarySaleHappened: null,
      isMutable: true,
    });
    const sig = await builder.sendAndConfirm(umi);
    return { signature: sig, created: false };
  }
}

async function run() {
  const umi = createUmi(DEVNET_RPC).use(mplTokenMetadata());
  const secret = loadSecret();
  const keypair = umi.eddsa.createKeypairFromSecretKey(secret);
  const signer = createSignerFromKeypair(umi, keypair);
  umi.use(signerIdentity(signer));

  console.log('👛 Wallet:', signer.publicKey.toString());
  console.log('🪙 SPYX Mint:', SPYX_MINT);

  // mSPYx metadata
  try {
    console.log('🔧 Setting metadata for mSPYx...');
    const res = await createOrUpdateMetadataUmi(
      umi,
      SPYX_MINT,
      'Mock SPYx',
      'mSPYx',
      'https://metadata.basalt.invalid/mSPYx.json'
    );
    console.log(`✅ mSPYx metadata ${res.created ? 'created' : 'updated'}:`, res.signature);
  } catch (e: any) {
    console.error('❌ Failed to set mSPYx metadata:', e?.message ?? e);
  }

  // mUSDrw metadata
  const usdrwMint = resolveUsdrwMintString();
  console.log('🪙 USDRw Mint:', usdrwMint);
  try {
    console.log('🔧 Setting metadata for mUSDrw...');
    const res = await createOrUpdateMetadataUmi(
      umi,
      usdrwMint,
      'Mock USDrw',
      'mUSDrw',
      'https://metadata.basalt.invalid/mUSDrw.json'
    );
    console.log(`✅ mUSDrw metadata ${res.created ? 'created' : 'updated'}:`, res.signature);
  } catch (e: any) {
    console.error('❌ Failed to set mUSDrw metadata:', e?.message ?? e);
    console.error('ℹ️ If USDrw mint authority is a PDA, metadata creation requires a program-side CPI using seeds.');
  }
}

run()
  .then(() => {
    console.log('🏁 Token metadata operation completed');
    process.exit(0);
  })
  .catch((err) => {
    console.error('💥 Token metadata operation failed:', err);
    process.exit(1);
  });