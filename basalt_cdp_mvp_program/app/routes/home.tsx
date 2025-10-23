import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useCdpActions } from '../solana/useCdpActions';
import { useCdpState } from '../solana/useCdpState';

export const Home = () => {
  const { connected, publicKey } = useWallet();
  const { 
    loading, 
    error, 
    initializeProtocol, 
    mintUsdrw, 
    redeemCollateral, 
    liquidateVault,
    calculateInterest
  } = useCdpActions();
  
  const { vault, protocolConfig, loading: stateLoading } = useCdpState();
  
  const [collateralMint, setCollateralMint] = useState('');
  const [usdrwMint, setUsdrwMint] = useState('');
  const [mintAmount, setMintAmount] = useState('');
  const [redeemAmount, setRedeemAmount] = useState('');
  const [liquidateVaultAddress, setLiquidateVaultAddress] = useState('');

  const handleInitializeProtocol = () => {
    if (!collateralMint || !usdrwMint) return;
    initializeProtocol(new PublicKey(collateralMint), new PublicKey(usdrwMint));
  };

  const handleMintUsdrw = () => {
    if (!mintAmount) return;
    mintUsdrw(parseInt(mintAmount));
  };

  const handleRedeemCollateral = () => {
    if (!redeemAmount) return;
    redeemCollateral(parseInt(redeemAmount));
  };

  const handleLiquidateVault = () => {
    if (!liquidateVaultAddress) return;
    liquidateVault(new PublicKey(liquidateVaultAddress));
  };

  const handleCalculateInterest = () => {
    calculateInterest();
  };

  if (!connected) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4">Welcome to BASALT CDP Protocol</h2>
          <p className="text-gray-600 mb-4">
            Please connect your wallet to interact with the protocol.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold mb-4">Protocol Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Collateral Mint Address
            </label>
            <input
              type="text"
              value={collateralMint}
              onChange={(e) => setCollateralMint(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Enter collateral mint address"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              USD_RW Mint Address
            </label>
            <input
              type="text"
              value={usdrwMint}
              onChange={(e) => setUsdrwMint(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Enter USD_RW mint address"
            />
          </div>
        </div>
        <button
          onClick={handleInitializeProtocol}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Initializing...' : 'Initialize Protocol'}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold mb-4">Mint USD_RW</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount to Mint
          </label>
          <input
            type="number"
            value={mintAmount}
            onChange={(e) => setMintAmount(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Enter amount to mint"
          />
        </div>
        <button
          onClick={handleMintUsdrw}
          disabled={loading}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Minting...' : 'Mint USD_RW'}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold mb-4">Redeem Collateral</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount to Redeem
          </label>
          <input
            type="number"
            value={redeemAmount}
            onChange={(e) => setRedeemAmount(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Enter amount to redeem"
          />
        </div>
        <button
          onClick={handleRedeemCollateral}
          disabled={loading}
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Redeeming...' : 'Redeem Collateral'}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold mb-4">Liquidate Vault</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Vault Address to Liquidate
          </label>
          <input
            type="text"
            value={liquidateVaultAddress}
            onChange={(e) => setLiquidateVaultAddress(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Enter vault address"
          />
        </div>
        <button
          onClick={handleLiquidateVault}
          disabled={loading}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Liquidating...' : 'Liquidate Vault'}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4">Interest Management</h2>
        <button
          onClick={handleCalculateInterest}
          disabled={loading}
          className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Calculating...' : 'Calculate Interest'}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4">
          {error}
        </div>
      )}
    </div>
  );
};