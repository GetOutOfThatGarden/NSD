/**
 * NSD Minting Program - Frontend Integration Hook
 * 
 * This React hook provides a comprehensive interface for interacting with the NSD Minting
 * Solana program from the frontend. It encapsulates all program instructions and provides
 * a clean API for frontend components to perform minting operations.
 * 
 * The hook handles:
 * - Program initialization and connection
 * - Transaction construction and signing
 * - Error handling and loading states
 * - Account address derivation for program PDAs
 */

import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction, SystemProgram, Keypair } from '@solana/web3.js';
import { useEffect, useState } from 'react';
import { useProgram } from './useProgram';

/**
 * Custom hook for NSD Minting program interactions
 * 
 * This hook provides all the necessary functions to interact with the NSD Minting program
 * including initialization, minting, configuration updates, and metadata setting.
 */
export const useNsdMinting = () => {
  // Get connection and wallet information from Solana context
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  // Get program instance and ID from useProgram hook
  const { program, programId } = useProgram();
  // State management for loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Initialize the NSD minting configuration
   * 
   * This function initializes the program configuration with the specified parameters.
   * It creates the configuration PDA and sets up the initial minting parameters.
   * 
   * @param tokenMint - The mint address for NSD token
   * @param maxSupply - Maximum supply of NSD tokens
   * @param mintPrice - Price per NSD token in lamports
   * @returns Promise resolving to the transaction signature or undefined
   */
  const initializeConfig = async (
    tokenMint: PublicKey,
    maxSupply: number,
    mintPrice: number
  ) => {
    // Check if wallet is connected and program is available
    if (!publicKey || !program) return;
    
    // Set loading state
    setLoading(true);
    setError(null);
    
    try {
      // Derive the configuration PDA address using seeds
      const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('nsd_config')],
        programId
      );

      // Build and send the transaction
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

      // Log successful transaction
      console.log('Initialize config transaction:', tx);
      return tx;
    } catch (err) {
      // Handle errors and set error state
      setError('Failed to initialize config');
      console.error(err);
    } finally {
      // Always reset loading state
      setLoading(false);
    }
  };

  /**
   * Mint NSD tokens for a user
   * 
   * This function mints NSD tokens to the connected user's associated token account.
   * It performs validation checks before minting and updates tracking information.
   * 
   * @param mintAmount - Number of tokens to mint
   * @returns Promise resolving to the transaction signature or undefined
   */
  const mintTokens = async (
    mintAmount: number
  ) => {
    // Check if wallet is connected and program is available
    if (!publicKey || !program) return;
    
    // Set loading state
    setLoading(true);
    setError(null);
    
    try {
      // Derive the configuration PDA address using seeds
      const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('nsd_config')],
        programId
      );

      // Build and send the transaction
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

      // Log successful transaction
      console.log('Mint tokens transaction:', tx);
      return tx;
    } catch (err) {
      // Handle errors and set error state
      setError('Failed to mint tokens');
      console.error(err);
    } finally {
      // Always reset loading state
      setLoading(false);
    }
  };

  /**
   * Update NSD minting configuration
   * 
   * This function updates the configuration parameters for NSD token minting.
   * It allows updating maximum supply, mint price, and active status.
   * 
   * @param maxSupply - New maximum supply (optional)
   * @param mintPrice - New mint price (optional)
   * @param isActive - New active status (optional)
   * @returns Promise resolving to the transaction signature or undefined
   */
  const updateConfig = async (
    maxSupply: number | null,
    mintPrice: number | null,
    isActive: boolean | null
  ) => {
    // Check if wallet is connected and program is available
    if (!publicKey || !program) return;
    
    // Set loading state
    setLoading(true);
    setError(null);
    
    try {
      // Derive the configuration PDA address using seeds
      const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('nsd_config')],
        programId
      );

      // Build and send the transaction
      const tx = await program.methods
        .updateConfig(maxSupply, mintPrice, isActive)
        .accounts({
          feePayer: publicKey,
          config: configPda,
          admin: publicKey,
        })
        .signers([])
        .rpc();

      // Log successful transaction
      console.log('Update config transaction:', tx);
      return tx;
    } catch (err) {
      // Handle errors and set error state
      setError('Failed to update config');
      console.error(err);
    } finally {
      // Always reset loading state
      setLoading(false);
    }
  };

  /**
   * Set metadata for NSD tokens
   * 
   * This function sets the metadata for NSD tokens including name, symbol, and URI.
   * It ensures only the admin can set metadata.
   * 
   * @param tokenMint - Mint address for NSD token
   * @param name - Name of the token
   * @param symbol - Symbol of the token
   * @param uri - URI for token metadata
   * @returns Promise resolving to the transaction signature or undefined
   */
  const setTokenMetadata = async (
    tokenMint: PublicKey,
    name: string,
    symbol: string,
    uri: string
  ) => {
    // Check if wallet is connected and program is available
    if (!publicKey || !program) return;
    
    // Set loading state
    setLoading(true);
    setError(null);
    
    try {
      // Derive the configuration PDA address using seeds
      const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('nsd_config')],
        programId
      );

      // Derive the metadata PDA address using token mint and seeds
      const [metadataPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('metadata'), tokenMint.toBuffer()],
        programId
      );

      // Build and send the transaction
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

      // Log successful transaction
      console.log('Set token metadata transaction:', tx);
      return tx;
    } catch (err) {
      // Handle errors and set error state
      setError('Failed to set token metadata');
      console.error(err);
    } finally {
      // Always reset loading state
      setLoading(false);
    }
  };

  // Return all functions and state for use in components
  return {
    loading,
    error,
    initializeConfig,
    mintTokens,
    updateConfig,
    setTokenMetadata,
  };
};