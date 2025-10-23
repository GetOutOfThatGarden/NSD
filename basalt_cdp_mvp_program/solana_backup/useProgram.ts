import { useEffect, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider, web3 } from '@coral-xyz/anchor';
import { getProgram, PROGRAM_ID } from './index';

export const useProgram = () => {
  const { connection } = useConnection();
  const { wallet, connected, publicKey, signTransaction, signAllTransactions } = useWallet();
  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!connected || !publicKey || !wallet) {
      setProgram(null);
      setLoading(false);
      return;
    }

    const initializeProgram = async () => {
      try {
        const provider = new AnchorProvider(
          connection,
          wallet,
          AnchorProvider.defaultOptions()
        );
        
        const program = new Program(
          // IDL would be imported here
          // For now, we'll use a placeholder
          {
            version: "0.1.0",
            name: "basalt_cdp_mvp",
            instructions: [],
            accounts: [],
            errors: []
          },
          PROGRAM_ID,
          provider
        );
        
        setProgram(program);
        setLoading(false);
      } catch (err) {
        setError('Failed to initialize program');
        setLoading(false);
        console.error(err);
      }
    };

    initializeProgram();
  }, [connected, publicKey, wallet, connection]);

  return { program, loading, error };
};