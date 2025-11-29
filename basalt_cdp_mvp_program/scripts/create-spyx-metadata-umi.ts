import fs from 'fs';
import path from 'path';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { createSignerFromKeypair, signerIdentity, publicKey } from '@metaplex-foundation/umi';
import { mplTokenMetadata, findMetadataPda, createMetadataAccountV3 } from '@metaplex-foundation/mpl-token-metadata';

// Config
const DEVNET_RPC = 'https://api.devnet.solana.com';
const SPYX_MINT = 'B5o7is4JQ4azcoNA9U9oN5wQ4DuQmdwLviwudFtiLuZ9';

async function main() {
  console.log('🚀 Creating metadata for mSPYx via Umi on devnet...');

  // Create Umi client and use Token Metadata plugin
  const umi = createUmi(DEVNET_RPC).use(mplTokenMetadata());

  // Load wallet
  const walletPath = path.join(process.env.HOME || '', '.config/solana/basalt.json');
  const secret = new Uint8Array(JSON.parse(fs.readFileSync(walletPath, 'utf8')));
  const keypair = umi.eddsa.createKeypairFromSecretKey(secret);
  const signer = createSignerFromKeypair(umi, keypair);
  umi.use(signerIdentity(signer));
  console.log('👛 Wallet:', signer.publicKey.toString());

  // Mint and metadata PDA
  const mint = publicKey(SPYX_MINT);
  const metadata = findMetadataPda(umi, { mint });
  console.log('🧩 Metadata PDA:', metadata.toString());

  // Create metadata
  const builder = createMetadataAccountV3(umi, {
    metadata,
    mint,
    mintAuthority: signer,
    payer: signer,
    updateAuthority: signer,
    data: {
      name: 'Mock SPYx',
      symbol: 'mSPYx',
      uri: 'https://metadata.basalt.invalid/mSPYx.json',
      sellerFeeBasisPoints: 0,
      creators: null,
      collection: null,
      uses: null,
    },
    isMutable: true,
    collectionDetails: null,
  });

  const tx = await builder.sendAndConfirm(umi);
  console.log('✅ mSPYx metadata created. Tx:', tx);
  console.log('🔍 Explorer:', `https://explorer.solana.com/tx/${tx}?cluster=devnet`);
}

main().catch((e) => {
  console.error('❌ Failed to create mSPYx metadata:', e);
  process.exit(1);
});