// Migrations are run in order
import { PublicKey } from '@solana/web3.js';
import { Program } from '@coral-xyz/anchor';

export default async function deploy(program: Program) {
  // Add your deployment logic here
  console.log('Deploying program...');
  
  // Example deployment steps
  // const tx = await program.methods.initializeProtocol(
  //   new PublicKey('CollateralMintAddress'),
  //   new PublicKey('USD_RW_MintAddress')
  // ).rpc();
  
  console.log('Program deployed successfully');
}