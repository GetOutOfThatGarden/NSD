import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction, SystemProgram, Keypair } from '@solana/web3.js';
import { useEffect, useState } from 'react';
import { useProgram } from './useProgram';

export const useNsdMinting = () => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const { program, programId } = useProgram();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize the NSD minting configuration
  const initializeConfig = async (
    tokenMint: PublicKey,
    maxSupply: number,
    mintPrice: number
  ) => {
    if (!publicKey || !program) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('nsd_config')],
        programId
      );

      const tx = await program.methods
        .initializeConfig(tokenMint, maxSupply, mintPrice)
        .accounts({
          feePayer: publicKey,
          config: configPda,
          admin: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([])
        .rpc();

      console.log('Initialize config transaction:', tx);
      return tx;
    } catch (err) {
      setError('Failed to initialize config');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Mint NSD tokens for a user
  const mintTokens = async (
    mintAmount: number
  ) => {
    if (!publicKey || !program) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('nsd_config')],
        programId
      );

      const tx = await program.methods
        .mintTokens(mintAmount)
        .accounts({
          feePayer: publicKey,
          config: configPda,
          user: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([])
        .rpc();

      console.log('Mint tokens transaction:', tx);
      return tx;
    } catch (err) {
      setError('Failed to mint tokens');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Update NSD minting configuration
  const updateConfig = async (
    maxSupply: number | null,
    mintPrice: number | null,
    isActive: boolean | null
  ) => {
    if (!publicKey || !program) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('nsd_config')],
        programId
      );

      const tx = await program.methods
        .updateConfig(maxSupply, mintPrice, isActive)
        .accounts({
          feePayer: publicKey,
          config: configPda,
          admin: publicKey,
        })
        .signers([])
        .rpc();

      console.log('Update config transaction:', tx);
      return tx;
    } catch (err) {
      setError('Failed to update config');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Set metadata for NSD tokens
  const setTokenMetadata = async (
    tokenMint: PublicKey,
    name: string,
    symbol: string,
    uri: string
  ) => {
    if (!publicKey || !program) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('nsd_config')],
        programId
      );

      const [metadataPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('metadata'), tokenMint.toBuffer()],
        programId
      );

      const tx = await program.methods
        .setTokenMetadata(tokenMint, name, symbol, uri)
        .accounts({
          feePayer: publicKey,
          config: configPda,
          metadata: metadataPda,
          admin: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([])
        .rpc();

      console.log('Set token metadata transaction:', tx);
      return tx;
    } catch (err) {
      setError('Failed to set token metadata');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    initializeConfig,
    mintTokens,
    updateConfig,
    setTokenMetadata,
  };
};