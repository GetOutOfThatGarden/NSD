import React, { useState, useCallback, useMemo } from 'react';
import type { FC } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { 
  PublicKey, 
  Transaction, 
  SystemProgram,
  SYSVAR_CLOCK_PUBKEY,
  LAMPORTS_PER_SOL
} from '@solana/web3.js';
import { 
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  getAccount
} from '@solana/spl-token';
import { Program, AnchorProvider, web3, BN } from '@coral-xyz/anchor';
import { PROGRAM_ID, USDRW_MINT, COLLATERAL_MINT, USDRW_DECIMALS, COLLATERAL_DECIMALS } from '../config';
import idl from '../idl/basalt_cdp_mvp.json';

interface BasaltCDPProps {}

export const BasaltCDP: FC = () => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  
  const [collateralAmount, setCollateralAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [txSignature, setTxSignature] = useState<string>('');
  const [spyxBalance, setSpyxBalance] = useState<number | null>(null);
  const [usdrwBalance, setUsdrwBalance] = useState<number | null>(null);

  // Create Anchor program instance
  const program = useMemo(() => {
    if (!publicKey) return null;
    
    const wallet = {
      publicKey,
      signTransaction: async <T extends Transaction | web3.VersionedTransaction>(tx: T): Promise<T> => {
        if (tx instanceof Transaction) {
          const signed = await sendTransaction(tx, connection);
          // Return the original transaction as it's been sent
          return tx;
        }
        throw new Error('VersionedTransaction not supported');
      },
      signAllTransactions: async <T extends Transaction | web3.VersionedTransaction>(txs: T[]): Promise<T[]> => {
        // For simplicity, we'll handle this case by case
        return txs; // Return as-is for now
      }
    };
    
    const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });
    
    return new Program(idl as any, provider);
  }, [connection, publicKey, sendTransaction]);

  // Derive PDAs
  const protocolConfigPDA = useMemo(() => {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('protocol_config')],
      PROGRAM_ID
    )[0];
  }, []);

  const userVaultPDA = useMemo(() => {
    if (!publicKey) return null;
    return PublicKey.findProgramAddressSync(
      [Buffer.from('vault'), publicKey.toBuffer(), protocolConfigPDA.toBuffer()],
      PROGRAM_ID
    )[0];
  }, [publicKey, protocolConfigPDA]);

  const protocolCollateralVaultPDA = useMemo(() => {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('collateral_vault'), protocolConfigPDA.toBuffer()],
      PROGRAM_ID
    )[0];
  }, [protocolConfigPDA]);

  // Get user token accounts
  const getUserTokenAccounts = useCallback(async () => {
    if (!publicKey) return { collateralATA: null, usdrwATA: null };

    const collateralATA = await getAssociatedTokenAddress(COLLATERAL_MINT, publicKey);
    const usdrwATA = await getAssociatedTokenAddress(USDRW_MINT, publicKey);

    return { collateralATA, usdrwATA };
  }, [publicKey]);

  // Fetch token balances
  const fetchTokenBalances = useCallback(async () => {
    if (!publicKey) {
      setSpyxBalance(null);
      setUsdrwBalance(null);
      return;
    }

    try {
      const { collateralATA, usdrwATA } = await getUserTokenAccounts();

      // Fetch SPYx balance
      try {
        const collateralAccount = await getAccount(connection, collateralATA!);
        const spyxAmount = Number(collateralAccount.amount) / Math.pow(10, COLLATERAL_DECIMALS);
        setSpyxBalance(spyxAmount);
      } catch {
        setSpyxBalance(0); // Account doesn't exist yet
      }

      // Fetch USDrw balance
      try {
        const usdrwAccount = await getAccount(connection, usdrwATA!);
        const usdrwAmount = Number(usdrwAccount.amount) / Math.pow(10, USDRW_DECIMALS);
        setUsdrwBalance(usdrwAmount);
      } catch {
        setUsdrwBalance(0); // Account doesn't exist yet
      }
    } catch (error) {
      console.error('Error fetching token balances:', error);
    }
  }, [publicKey, connection, getUserTokenAccounts]);

  // Fetch balances when wallet connects
  React.useEffect(() => {
    fetchTokenBalances();
  }, [fetchTokenBalances]);

  // Create token accounts if they don't exist
  const ensureTokenAccounts = useCallback(async () => {
    if (!publicKey || !sendTransaction) return { collateralATA: null, usdrwATA: null };

    const { collateralATA, usdrwATA } = await getUserTokenAccounts();
    console.log('=== CHECKING TOKEN ACCOUNTS ===');
    console.log('Collateral ATA:', collateralATA?.toString());
    console.log('USDrw ATA:', usdrwATA?.toString());

    const ataTransactions: Transaction[] = [];

    // Check if collateral ATA exists
    try {
      await getAccount(connection, collateralATA!);
      console.log('Collateral ATA exists');
    } catch (error) {
      console.log('Collateral ATA does not exist, creating...');
      const createCollateralATATransaction = new Transaction().add(
        createAssociatedTokenAccountInstruction(
          publicKey,
          collateralATA!,
          publicKey,
          COLLATERAL_MINT
        )
      );
      ataTransactions.push(createCollateralATATransaction);
    }

    // Check if USDrw ATA exists
    try {
      await getAccount(connection, usdrwATA!);
      console.log('USDrw ATA exists');
    } catch (error) {
      console.log('USDrw ATA does not exist, creating...');
      const createUsdrwATATransaction = new Transaction().add(
        createAssociatedTokenAccountInstruction(
          publicKey,
          usdrwATA!,
          publicKey,
          USDRW_MINT
        )
      );
      ataTransactions.push(createUsdrwATATransaction);
    }

    // Send ATA creation transactions if needed
    if (ataTransactions.length > 0) {
      console.log(`=== CREATING ${ataTransactions.length} TOKEN ACCOUNT(S) ===`);
      for (let i = 0; i < ataTransactions.length; i++) {
        const tx = ataTransactions[i];
        const { blockhash } = await connection.getLatestBlockhash();
        tx.recentBlockhash = blockhash;
        tx.feePayer = publicKey;
        
        console.log(`Sending ATA creation transaction ${i + 1}/${ataTransactions.length}...`);
        const signature = await sendTransaction(tx, connection);
        console.log(`ATA creation transaction ${i + 1} sent:`, signature);
        
        // Wait for confirmation
        await connection.confirmTransaction(signature, 'confirmed');
        console.log(`ATA creation transaction ${i + 1} confirmed`);
      }
    }

    console.log('=== TOKEN ACCOUNT CHECK COMPLETE ===');
    return { collateralATA, usdrwATA };
  }, [connection, publicKey, sendTransaction, getUserTokenAccounts]);

  // Handle deposit and mint
  const handleDepositAndMint = useCallback(async () => {
    if (!program || !publicKey || !userVaultPDA) {
      setStatus('Please connect your wallet first');
      return;
    }

    if (!collateralAmount || parseFloat(collateralAmount) <= 0) {
      setStatus('Please enter a valid collateral amount');
      return;
    }

    setIsLoading(true);
    setStatus('Processing transaction...');
    setTxSignature('');

    try {
      console.log('=== TRANSACTION SETUP ===');
      console.log('Wallet:', publicKey.toString());
      console.log('Collateral amount:', collateralAmount);
      console.log('Program ID:', PROGRAM_ID.toString());
      console.log('Protocol Config PDA:', protocolConfigPDA.toString());
      console.log('User Vault PDA:', userVaultPDA.toString());
      console.log('Protocol Collateral Vault PDA:', protocolCollateralVaultPDA.toString());
      console.log('Collateral Mint:', COLLATERAL_MINT.toString());
      console.log('USDrw Mint:', USDRW_MINT.toString());
      
      // Convert collateral amount to smallest unit (SPYx has 9 decimals)
      const collateralLamports = new BN(parseFloat(collateralAmount) * LAMPORTS_PER_SOL);
      console.log('Collateral lamports:', collateralLamports.toString());
      
      // Calculate USDrw to mint (assuming 1:1 ratio for demo, in reality this would be based on collateral ratio)
      const usdrwToMint = new BN(parseFloat(collateralAmount) * Math.pow(10, USDRW_DECIMALS));
      console.log('USDrw to mint:', usdrwToMint.toString());

      const transaction = new Transaction();

      // Ensure token accounts exist
      const { collateralATA, usdrwATA } = await ensureTokenAccounts();

      if (!collateralATA || !usdrwATA) {
        throw new Error('Failed to get token accounts');
      }

      // Add mint_usdrw instruction
      const mintInstruction = await program.methods
        .mintUsdrw(collateralLamports)
        .accounts({
          user: publicKey,
          protocolConfig: protocolConfigPDA,
          userVault: userVaultPDA,
          userCollateralAccount: collateralATA,
          protocolCollateralAccount: protocolCollateralVaultPDA,
          userUsdrwAccount: usdrwATA,
          usdrwMint: USDRW_MINT,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .instruction();

      console.log('=== INSTRUCTION DETAILS ===');
      console.log('Mint instruction:', mintInstruction);
      console.log('Instruction keys:', mintInstruction.keys);
      console.log('Instruction program ID:', mintInstruction.programId.toString());
      console.log('Instruction data length:', mintInstruction.data.length);
      
      // Log each account in detail
      console.log('=== ACCOUNT VERIFICATION ===');
      mintInstruction.keys.forEach((key, index) => {
        console.log(`Account ${index}:`, {
          pubkey: key.pubkey.toString(),
          isSigner: key.isSigner,
          isWritable: key.isWritable
        });
      });

      transaction.add(mintInstruction);

      // Set the fee payer for the transaction
      transaction.feePayer = publicKey;
      
      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;

      console.log('=== TRANSACTION DETAILS ===');
      console.log('Transaction:', transaction);
      console.log('Transaction instructions count:', transaction.instructions.length);
      console.log('Recent blockhash:', transaction.recentBlockhash);
      console.log('Fee payer:', transaction.feePayer?.toString());

      // Simulate transaction first to get detailed error information
      console.log('=== SIMULATING TRANSACTION ===');
      try {
        const simulationResult = await connection.simulateTransaction(transaction);
        
        console.log('=== SIMULATION RESULT ===');
        console.log('Simulation successful:', !simulationResult.value.err);
        console.log('Simulation result:', simulationResult);
        console.log('Simulation logs:', simulationResult.value.logs);
        console.log('Simulation accounts:', simulationResult.value.accounts);
        console.log('Simulation units consumed:', simulationResult.value.unitsConsumed);
        
        if (simulationResult.value.err) {
          console.log('=== SIMULATION ERROR DETAILS ===');
          console.log('Error type:', typeof simulationResult.value.err);
          console.log('Error value:', simulationResult.value.err);
          console.log('Error JSON:', JSON.stringify(simulationResult.value.err, null, 2));
          
          // Try to get more detailed error information
          if (simulationResult.value.logs) {
            console.log('=== DETAILED LOGS ===');
            simulationResult.value.logs.forEach((log, index) => {
              console.log(`Log ${index}:`, log);
            });
          }
          
          throw new Error(`Transaction simulation failed: ${JSON.stringify(simulationResult.value.err)}`);
        } else {
          console.log('Simulation successful!');
          console.log('Simulation logs:', simulationResult.value.logs);
        }
      } catch (simError: any) {
        console.log('=== SIMULATION EXCEPTION ===');
        console.log('Exception type:', typeof simError);
        console.log('Exception message:', simError.message);
        console.log('Exception stack:', simError.stack);
        console.log('Full exception:', simError);
        
        throw new Error(`Transaction simulation failed: ${simError.message}`);
      }

      // Send transaction
      console.log('=== SENDING TRANSACTION ===');
      const signature = await sendTransaction(transaction, connection);
      
      setTxSignature(signature);
      setStatus(`Transaction successful! Signature: ${signature}`);
      
      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed');
      setStatus(`Transaction confirmed! Deposited ${collateralAmount} SPYx and minted USDrw`);
      
      // Refresh token balances
      await fetchTokenBalances();
      
    } catch (error: any) {
      console.error('=== TRANSACTION ERROR DETAILS ===');
      console.error('Full error object:', error);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      console.error('Error name:', error.name);
      
      if (error.logs) {
        console.error('Transaction logs:', error.logs);
      }
      
      if (error.transactionMessage) {
        console.error('Transaction message:', error.transactionMessage);
      }
      
      if (error.simulationResponse) {
        console.error('Simulation response:', error.simulationResponse);
      }
      
      // Check for specific Anchor errors
      if (error.error && error.error.errorCode) {
        console.error('Anchor error code:', error.error.errorCode);
        console.error('Anchor error message:', error.error.errorMessage);
      }
      
      console.error('=== END ERROR DETAILS ===');
      
      let errorMessage = 'Unexpected error';
      if (error.message) {
        errorMessage = error.message;
      } else if (error.error && error.error.errorMessage) {
        errorMessage = error.error.errorMessage;
      }
      
      setStatus(`Transaction failed: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [
    program,
    publicKey,
    userVaultPDA,
    collateralAmount,
    protocolConfigPDA,
    protocolCollateralVaultPDA,
    sendTransaction,
    connection,
    ensureTokenAccounts
  ]);

  return (
    <div className="basalt-cdp">
      <h2>Basalt CDP - Deposit & Mint</h2>
      
      {!publicKey ? (
        <div className="wallet-section">
          <p>Please connect your wallet to continue</p>
          <WalletMultiButton />
        </div>
      ) : (
        <div>
          <div className="wallet-section">
            <p>Connected: {publicKey.toBase58().slice(0, 8)}...{publicKey.toBase58().slice(-8)}</p>
            <WalletMultiButton />
          </div>

          <div className="balance-section">
            <h3>Token Balances</h3>
            <div className="balance-display">
              <div className="balance-item">
                <span className="token-name">Mock SPYx:</span>
                <span className="token-amount">
                  {spyxBalance !== null ? `${spyxBalance.toFixed(2)}` : 'Loading...'}
                </span>
              </div>
              <div className="balance-item">
                <span className="token-name">USDrw:</span>
                <span className="token-amount">
                  {usdrwBalance !== null ? `${usdrwBalance.toFixed(2)}` : 'Loading...'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="deposit-section">
            <h3>Deposit SPYx Collateral & Mint USDrw</h3>
            <div className="input-group">
              <label htmlFor="collateral-amount">
                  Collateral Amount (SPYx):
              </label>
              <input
                id="collateral-amount"
                type="number"
                value={collateralAmount}
                onChange={(e) => setCollateralAmount(e.target.value)}
                placeholder="Enter amount (e.g., 1.0)"
                min="0"
                step="0.01"
                disabled={isLoading}
              />
            </div>
            
            <button
              className="action-button"
              onClick={handleDepositAndMint}
              disabled={isLoading || !collateralAmount || parseFloat(collateralAmount) <= 0}
            >
              {isLoading ? 'Processing...' : 'Deposit & Mint USDrw'}
            </button>
            
            {status && (
              <div className={`status-message ${
                status.includes('failed') || status.includes('error') ? 'error' : 
                status.includes('Processing') || status.includes('Confirming') ? 'loading' : 
                'success'
              }`}>
                {status}
              </div>
            )}

            {txSignature && (
              <div className="tx-link">
                <a
                  href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View on Solana Explorer
                </a>
              </div>
            )}
          </div>

          <div className="info-section">
            <p>Connected to Solana Devnet</p>
            <p>Program: {PROGRAM_ID.toString().slice(0, 8)}...</p>
          </div>
        </div>
      )}
    </div>
  );
};