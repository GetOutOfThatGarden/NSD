import { FC, ReactNode, useMemo, useCallback } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';

type Props = { children: ReactNode };

export const WalletProviders: FC<Props> = ({ children }) => {
  // Use import.meta with a safe cast to avoid TS build-time typing issues
  const viteEnv = (import.meta as any).env || {};
  const network = (viteEnv.VITE_SOLANA_CLUSTER as 'devnet' | 'testnet' | 'mainnet-beta' | 'localnet') || 'devnet';
  const customRpc = viteEnv.VITE_SOLANA_RPC_URL as string | undefined;

  const endpoint = useMemo(() => {
    if (network === 'localnet') return customRpc || 'http://127.0.0.1:8899';
    return customRpc || clusterApiUrl(network);
  }, [network, customRpc]);

  const wallets = useMemo(() => [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
  ], []);

  const onError = useCallback((error: unknown) => {
    console.error('[WalletAdapter] Error', error);
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect onError={onError}>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};