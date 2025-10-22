import { useWallet } from '@solana/wallet-adapter-react';
import { useState, useEffect } from 'react';

export const Header = () => {
  const { publicKey, connecting, connected, disconnect } = useWallet();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  return (
    <header className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-xl font-bold">BASALT CDP Protocol</h1>
        <div className="flex items-center space-x-4">
          {connected ? (
            <div className="flex items-center space-x-2">
              <span className="text-sm">
                {publicKey?.toBase58().slice(0, 4)}...{publicKey?.toBase58().slice(-4)}
              </span>
              <button
                onClick={disconnect}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <div className="text-sm">
              {connecting ? 'Connecting...' : 'Connect Wallet'}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};