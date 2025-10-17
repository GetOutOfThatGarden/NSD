import { useNsdMinting } from '../solana/useNsdMinting';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useState } from 'react';

export default function Home() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const {
    loading,
    error,
    initializeConfig,
    mintTokens,
    updateConfig,
    setTokenMetadata
  } = useNsdMinting();
  const [tokenMint, setTokenMint] = useState('');
  const [maxSupply, setMaxSupply] = useState('');
  const [mintPrice, setMintPrice] = useState('');
  const [mintAmount, setMintAmount] = useState('');
  const [newMaxSupply, setNewMaxSupply] = useState('');
  const [newMintPrice, setNewMintPrice] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [uri, setUri] = useState('');

  const handleInitializeConfig = async () => {
    if (!publicKey || !tokenMint) return;
    
    try {
      const tokenMintPubkey = new PublicKey(tokenMint);
      await initializeConfig(
        tokenMintPubkey,
        parseInt(maxSupply),
        parseInt(mintPrice)
      );
    } catch (err) {
      console.error('Failed to initialize config:', err);
    }
  };

  const handleMintTokens = async () => {
    if (!publicKey) return;
    
    try {
      await mintTokens(parseInt(mintAmount));
    } catch (err) {
      console.error('Failed to mint tokens:', err);
    }
  };

  const handleUpdateConfig = async () => {
    if (!publicKey) return;
    
    try {
      await updateConfig(
        newMaxSupply ? parseInt(newMaxSupply) : null,
        newMintPrice ? parseInt(newMintPrice) : null,
        isActive
      );
    } catch (err) {
      console.error('Failed to update config:', err);
    }
  };

  const handleSetTokenMetadata = async () => {
    if (!publicKey || !tokenMint) return;
    
    try {
      const tokenMintPubkey = new PublicKey(tokenMint);
      await setTokenMetadata(
        tokenMintPubkey,
        name,
        symbol,
        uri
      );
    } catch (err) {
      console.error('Failed to set token metadata:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">NSD Minting Program</h1>
          <p className="text-gray-600">Manage NSD token minting and configurations</p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Initialize Config</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Token Mint Address</label>
              <input
                type="text"
                value={tokenMint}
                onChange={(e) => setTokenMint(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter token mint address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Supply</label>
              <input
                type="number"
                value={maxSupply}
                onChange={(e) => setMaxSupply(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter max supply"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mint Price (lamports)</label>
              <input
                type="number"
                value={mintPrice}
                onChange={(e) => setMintPrice(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter mint price"
              />
            </div>
            <button
              onClick={handleInitializeConfig}
              disabled={loading || !publicKey}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Initializing...' : 'Initialize Config'}
            </button>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Mint Tokens</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount to Mint</label>
              <input
                type="number"
                value={mintAmount}
                onChange={(e) => setMintAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter amount to mint"
              />
            </div>
            <button
              onClick={handleMintTokens}
              disabled={loading || !publicKey}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {loading ? 'Minting...' : 'Mint Tokens'}
            </button>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Update Config</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Max Supply (optional)</label>
              <input
                type="number"
                value={newMaxSupply}
                onChange={(e) => setNewMaxSupply(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter new max supply"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Mint Price (optional)</label>
              <input
                type="number"
                value={newMintPrice}
                onChange={(e) => setNewMintPrice(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter new mint price"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                Active
              </label>
            </div>
            <button
              onClick={handleUpdateConfig}
              disabled={loading || !publicKey}
              className="w-full bg-yellow-600 text-white py-2 px-4 rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Config'}
            </button>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Set Token Metadata</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Token Mint Address</label>
              <input
                type="text"
                value={tokenMint}
                onChange={(e) => setTokenMint(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter token mint address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter token name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Symbol</label>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter token symbol"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URI</label>
              <input
                type="text"
                value={uri}
                onChange={(e) => setUri(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter token metadata URI"
              />
            </div>
            <button
              onClick={handleSetTokenMetadata}
              disabled={loading || !publicKey}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
            >
              {loading ? 'Setting...' : 'Set Token Metadata'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}