import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { BasaltCdpMvp } from '../target/types/basalt_cdp_mvp';

describe('basalt-cdp-mvp', () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.BasaltCdpMvp as Program<BasaltCdpMvp>;

  it('Is initialized!', async () => {
    // Add your test here.
    const tx = await program.methods.initializeProtocol(
      new anchor.web3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
      new anchor.web3.PublicKey('USD_RW_MINT_ADDRESS')
    ).rpc();
    console.log("Your transaction signature", tx);
  });
});