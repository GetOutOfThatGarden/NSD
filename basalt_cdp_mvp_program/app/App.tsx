import { useState, useEffect } from 'react';
import { Card } from './components/ui/card';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Badge } from './components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { AlertTriangle, TrendingUp, TrendingDown, Wallet, RefreshCw, CheckCircle, ExternalLink, X } from 'lucide-react';
import { BasaltLogo } from './components/BasaltLogo.tsx';

import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PublicKey, Transaction, ComputeBudgetProgram } from '@solana/web3.js';
import { getAssociatedTokenAddress, getMint } from '@solana/spl-token';
import { buildMintUsdrwInstruction, buildRedeemCollateralInstruction } from './solana/instructions';
import { findProtocolConfigPda, findUserVaultPda, findProtocolCollateralAccountPda } from './solana/pdas';
import { PROGRAM_ID, COLLATERAL_MINT, USDRW_MINT } from './solana/config';
import { useAccountData } from './hooks/useAccountData';

type Scenario = 'baseline' | 'scenario1' | 'scenario2' | 'scenario3';

interface ScenarioData {
  name: string;
  description: string;
  assetChange: number;
}

const scenarios: Record<Scenario, ScenarioData> = {
  baseline: {
    name: 'BASELINE',
    description: 'Current State',
    assetChange: 0,
  },
  scenario1: {
    name: 'SCENARIO 1',
    description: 'SPY ↑ 10%',
    assetChange: 10,
  },
  scenario2: {
    name: 'SCENARIO 2',
    description: 'SPY ↓ 10%',
    assetChange: -10,
  },
  scenario3: {
    name: 'SCENARIO 3',
    description: 'Custom',
    assetChange: -20,
  },
};

export default function App() {
  // Wallet integration
  const { publicKey, sendTransaction, connected } = useWallet();
  const { connection } = useConnection();
  
  // Real-time account data
  const { 
    userVault, 
    protocolConfig, 
    isLoading: accountLoading, 
    error: accountError, 
    healthRatio, 
    isLiquidatable, 
    collateralValue, 
    debtValue,
    refreshData 
  } = useAccountData();
  
  // Transaction state
  const [isTransacting, setIsTransacting] = useState(false);
  const [transactionError, setTransactionError] = useState<string | null>(null);
  
  // Success dialog state

  const [successTransactionData, setSuccessTransactionData] = useState<{
    signature: string;
    type: 'deposit_mint' | 'redeem_collateral' | 'repay_debt' | 'deposit_more';
    details: {
      collateralAmount?: number;
      usdrwAmount?: number;
      collateralSymbol?: string;
      usdrwSymbol?: string;
    };
  } | null>(null);
  
  const [activeScenario, setActiveScenario] = useState<Scenario>('baseline');
  const [spyAmount, setSpyAmount] = useState('');
  const [usdrwAmount, setUsdrwAmount] = useState('');
  const [activeTab, setActiveTab] = useState('mint-borrow');
  const [usdrwRepayAmount, setUsdrwRepayAmount] = useState('0');
  const [spyWithdrawAmount, setSpyWithdrawAmount] = useState('0');
  const [customScenario3, setCustomScenario3] = useState('-20');
  const [customScenario3Error, setCustomScenario3Error] = useState(false);
  
  // LTV ratio for the demo slider (cosmetic)
  const [ltvRatio, setLtvRatio] = useState(50); // Default to 50%
  
  // Live price data - Ready for API integration
  const [spyPrice, setSpyPrice] = useState<number>(670); // Updated to $670 for demo
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Responsive gap: min 16px (1rem) on mobile, scales up on larger screens
  const rowGapClass = "gap-4 sm:gap-5 lg:gap-6";

  // Auto-populate USDrw field based on SPY amount and LTV ratio
  useEffect(() => {
    if (spyAmount && !isNaN(parseFloat(spyAmount))) {
      const spyValue = parseFloat(spyAmount) * spyPrice;
      const usdrwToMint = (spyValue * ltvRatio) / 100;
      setUsdrwAmount(usdrwToMint.toFixed(2));
    } else {
      setUsdrwAmount('');
    }
  }, [spyAmount, ltvRatio, spyPrice]);

  // TODO: Implement real API integration
  // CoinMarketCap API requires a backend proxy to avoid CORS issues
  // API endpoint: https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=SPYX
  // API Key: [REDACTED]
  const fetchSpyxPrice = async () => {
    try {
      setPriceError(null);
      setPriceLoading(true);
      
      // TODO: Replace with actual API call through backend proxy
      // Example implementation:
      // const response = await fetch('/api/spyx-price');
      // const data = await response.json();
      // setSpyPrice(data.price);
      // setLastUpdated(new Date());
      
      setPriceLoading(false);
    } catch (error) {
      console.error('Error fetching SPYX price:', error);
      setPriceError('Failed to load live price. Using fallback.');
      setPriceLoading(false);
    }
  };

  // Transaction functions
  const handleDepositAndMint = async () => {
    if (!publicKey || !connected) {
      setTransactionError('Please connect your wallet first');
      return;
    }

    try {
      setIsTransacting(true);
      setTransactionError(null);

      console.log('🚀 Starting deposit and mint transaction...');
      console.log('📊 Input values:', { spyAmount, usdrwAmount });

      const collateralAmount = parseFloat(spyAmount);
      const usdrwMintAmount = parseFloat(usdrwAmount);

      console.log('🔢 Parsed amounts:', { collateralAmount, usdrwMintAmount });

      if (isNaN(collateralAmount) || collateralAmount <= 0) {
        throw new Error('Invalid collateral amount');
      }
      if (isNaN(usdrwMintAmount) || usdrwMintAmount <= 0) {
        throw new Error('Invalid USDrw mint amount');
      }

      // Fetch collateral mint information to get correct decimals
      console.log('🔍 Fetching collateral mint information...');
      const collateralMintInfo = await getMint(connection, COLLATERAL_MINT);
      const collateralDecimals = collateralMintInfo.decimals;
      console.log('📊 Collateral mint decimals:', collateralDecimals);

      // Convert collateral amount to lamports using correct decimals
      const collateralAmountLamports = Math.floor(collateralAmount * Math.pow(10, collateralDecimals));
      console.log('💰 Collateral amount in lamports:', collateralAmountLamports);

      // Find PDAs
      console.log('🔍 Finding PDAs...');
      const [protocolConfigPda] = findProtocolConfigPda(PROGRAM_ID);
      const [userVaultPda] = findUserVaultPda(publicKey, protocolConfigPda, PROGRAM_ID);
      const [protocolCollateralAccountPda] = findProtocolCollateralAccountPda(protocolConfigPda, PROGRAM_ID);

      console.log('📋 PDAs found:', {
        protocolConfig: protocolConfigPda.toBase58(),
        userVault: userVaultPda.toBase58(),
        protocolCollateralAccount: protocolCollateralAccountPda.toBase58()
      });

      // Verify protocol configuration account exists
      console.log('🔍 Checking protocol configuration account...');
      try {
        const protocolConfigInfo = await connection.getAccountInfo(protocolConfigPda);
        if (!protocolConfigInfo) {
          throw new Error('Protocol configuration account does not exist. Please initialize the protocol first.');
        }
        console.log('✅ Protocol configuration account exists:', {
          owner: protocolConfigInfo.owner.toString(),
          dataLength: protocolConfigInfo.data.length,
          lamports: protocolConfigInfo.lamports,
        });
      } catch (configError) {
        console.error('❌ Protocol configuration check failed:', configError);
        throw configError;
      }

      // Derive Associated Token Accounts
      console.log('🔗 Deriving token accounts...');
      const userCollateralAccount = await getAssociatedTokenAddress(
        COLLATERAL_MINT,
        publicKey
      );
      
      const userUsdrwAccount = await getAssociatedTokenAddress(
        USDRW_MINT,
        publicKey
      );

      console.log('🏦 Token accounts:', {
        userCollateral: userCollateralAccount.toBase58(),
        userUsdrw: userUsdrwAccount.toBase58(),
        collateralMint: COLLATERAL_MINT.toBase58(),
        usdrwMint: USDRW_MINT.toBase58()
      });

      // Check if token accounts exist
      console.log('✅ Checking token account balances...');
      try {
        const collateralAccountInfo = await connection.getAccountInfo(userCollateralAccount);
        const usdrwAccountInfo = await connection.getAccountInfo(userUsdrwAccount);
        
        console.log('💳 Account existence:', {
          collateralExists: !!collateralAccountInfo,
          usdrwExists: !!usdrwAccountInfo
        });

        if (collateralAccountInfo) {
          const collateralBalance = await connection.getTokenAccountBalance(userCollateralAccount);
          console.log('💰 Collateral balance:', collateralBalance.value);
        }
      } catch (balanceError) {
        console.warn('⚠️ Could not check token balances:', balanceError);
      }

      // Build instruction with proper token accounts
      // NOTE: The Rust program expects collateral_amount, not usdrw_amount
      console.log('🔨 Building transaction instruction...');
      const instruction = buildMintUsdrwInstruction({
        user: publicKey,
        protocolConfig: protocolConfigPda,
        userVault: userVaultPda,
        userCollateralAccount: userCollateralAccount,
        protocolCollateralAccount: protocolCollateralAccountPda,
        userUsdrwAccount: userUsdrwAccount,
        usdrwMint: USDRW_MINT,
        amount: collateralAmount, // Pass unscaled amount - toU64Le will handle the scaling
        amountDecimals: collateralDecimals, // Use dynamically fetched decimals
        programId: PROGRAM_ID
      });

      console.log('📦 Instruction built successfully');

      // Create and send transaction
      console.log('📤 Creating and sending transaction...');
      const transaction = new Transaction();
      
      // Add compute budget instruction to handle complex operations
      const computeBudgetInstruction = ComputeBudgetProgram.setComputeUnitLimit({
        units: 400_000, // Increase compute units for complex operations
      });
      transaction.add(computeBudgetInstruction);
      transaction.add(instruction);
      
      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      console.log('🔐 Transaction details:', {
        feePayer: transaction.feePayer?.toBase58(),
        recentBlockhash: transaction.recentBlockhash,
        instructionCount: transaction.instructions.length
      });

      // Simulate transaction first to get detailed error information
      console.log('🧪 Simulating transaction...');
      try {
        const simulationResult = await connection.simulateTransaction(transaction);
        console.log('✅ Simulation result:', simulationResult);
        
        if (simulationResult.value.err) {
          console.error('❌ Simulation failed:', simulationResult.value.err);
          console.error('📋 Simulation logs:', simulationResult.value.logs);
          throw new Error(`Transaction simulation failed: ${JSON.stringify(simulationResult.value.err)}`);
        }
        
        console.log('✅ Simulation successful, proceeding with transaction...');
        console.log('📋 Simulation logs:', simulationResult.value.logs);
      } catch (simError) {
        console.error('❌ Simulation error:', simError);
        throw simError;
      }

      const signature = await sendTransaction(transaction, connection);
      
      console.log('✅ Transaction sent successfully!');
      console.log('📝 Transaction signature:', signature);
      console.log('🔍 View on explorer:', `https://explorer.solana.com/tx/${signature}?cluster=devnet`);
      
      // Wait for confirmation
      console.log('⏳ Waiting for transaction confirmation...');
      const confirmation = await connection.confirmTransaction(signature, 'confirmed');
      
      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
      }
      
      console.log('🎉 Transaction confirmed successfully!');
      setTransactionError(null);
      
      // Show success dialog
      setSuccessTransactionData({
        signature,
        type: 'deposit_mint',
        details: {
          collateralAmount,
          usdrwAmount: usdrwMintAmount,
          collateralSymbol: 'SPYx',
          usdrwSymbol: 'USDrw'
        }
      });
      
    } catch (error) {
      console.error('❌ Transaction failed with detailed error:', error);
      
      // Enhanced error logging
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      
      // Check if it's a wallet error
      if (error && typeof error === 'object' && 'message' in error) {
        console.error('Wallet error details:', error);
      }
      
      setTransactionError(error instanceof Error ? error.message : 'Transaction failed');
    } finally {
      setIsTransacting(false);
    }
  };

  const handleRedeemCollateral = async () => {
    if (!publicKey || !connected) {
      setTransactionError('Please connect your wallet first');
      return;
    }

    try {
      setIsTransacting(true);
      setTransactionError(null);

      const collateralAmount = parseFloat(spyWithdrawAmount);
      const usdrwBurnAmount = parseFloat(usdrwRepayAmount);

      if (isNaN(collateralAmount) || collateralAmount <= 0) {
        throw new Error('Invalid collateral amount');
      }
      if (isNaN(usdrwBurnAmount) || usdrwBurnAmount <= 0) {
        throw new Error('Invalid USDrw burn amount');
      }

      // Find PDAs
      const [protocolConfigPda] = findProtocolConfigPda(PROGRAM_ID);
      const [userVaultPda] = findUserVaultPda(publicKey, protocolConfigPda, PROGRAM_ID);
      const [protocolCollateralAccountPda] = findProtocolCollateralAccountPda(protocolConfigPda, PROGRAM_ID);

      // Derive Associated Token Accounts
      const userCollateralAccount = await getAssociatedTokenAddress(
        COLLATERAL_MINT,
        publicKey
      );
      
      const userUsdrwAccount = await getAssociatedTokenAddress(
        USDRW_MINT,
        publicKey
      );

      // Build instruction with proper token accounts
      const instruction = buildRedeemCollateralInstruction({
        user: publicKey,
        protocolConfig: protocolConfigPda,
        userVault: userVaultPda,
        userCollateralAccount: userCollateralAccount,
        protocolCollateralAccount: protocolCollateralAccountPda,
        userUsdrwAccount: userUsdrwAccount,
        usdrwMint: USDRW_MINT,
        amount: usdrwBurnAmount,
        amountDecimals: 6, // USDrw decimals
        programId: PROGRAM_ID
      });

      // Create and send transaction
      const transaction = new Transaction().add(instruction);
      const signature = await sendTransaction(transaction, connection);
      
      console.log('Transaction sent:', signature);
      // TODO: Add confirmation waiting and success feedback
      
    } catch (error) {
      console.error('Transaction failed:', error);
      setTransactionError(error instanceof Error ? error.message : 'Transaction failed');
    } finally {
      setIsTransacting(false);
    }
  };

  const handleDepositMoreCollateral = async () => {
    if (!publicKey || !sendTransaction) return;
    
    try {
      setIsTransacting(true);
      setTransactionError(null);

      // TODO: Get deposit amount from input field
      const depositAmount = 1; // Placeholder - should come from input

      if (isNaN(depositAmount) || depositAmount <= 0) {
        throw new Error('Invalid deposit amount');
      }

      // Find PDAs
      const [protocolConfigPda] = findProtocolConfigPda(PROGRAM_ID);
      const [userVaultPda] = findUserVaultPda(publicKey, protocolConfigPda, PROGRAM_ID);

      // TODO: Build deposit instruction when available
      console.log('Deposit more collateral:', { depositAmount, userVaultPda });
      
      // Placeholder for now
      throw new Error('Deposit more collateral functionality coming soon');
      
    } catch (error) {
      console.error('Deposit failed:', error);
      setTransactionError(error instanceof Error ? error.message : 'Deposit failed');
    } finally {
      setIsTransacting(false);
    }
  };

  const handleRepayDebt = async () => {
    if (!publicKey || !sendTransaction) return;
    
    try {
      setIsTransacting(true);
      setTransactionError(null);

      const repayAmount = parseFloat(usdrwRepayAmount);

      if (isNaN(repayAmount) || repayAmount <= 0) {
        throw new Error('Invalid repay amount');
      }

      // Find PDAs
      const [protocolConfigPda] = findProtocolConfigPda(PROGRAM_ID);
      const [userVaultPda] = findUserVaultPda(publicKey, protocolConfigPda, PROGRAM_ID);

      // TODO: Build repay instruction when available
      console.log('Repay debt:', { repayAmount, userVaultPda });
      
      // Placeholder for now
      throw new Error('Repay debt functionality coming soon');
      
    } catch (error) {
      console.error('Repay failed:', error);
      setTransactionError(error instanceof Error ? error.message : 'Repay failed');
    } finally {
      setIsTransacting(false);
    }
  };

  const handleWithdrawCollateral = async () => {
    if (!publicKey || !sendTransaction) return;
    
    try {
      setIsTransacting(true);
      setTransactionError(null);

      const withdrawAmount = parseFloat(spyWithdrawAmount);

      if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
        throw new Error('Invalid withdraw amount');
      }

      // Find PDAs
      const [protocolConfigPda] = findProtocolConfigPda(PROGRAM_ID);
      const [userVaultPda] = findUserVaultPda(publicKey, protocolConfigPda, PROGRAM_ID);

      // TODO: Build withdraw instruction when available
      console.log('Withdraw collateral:', { withdrawAmount, userVaultPda });
      
      // Placeholder for now
      throw new Error('Withdraw collateral functionality coming soon');
      
    } catch (error) {
      console.error('Withdraw failed:', error);
      setTransactionError(error instanceof Error ? error.message : 'Withdraw failed');
    } finally {
      setIsTransacting(false);
    }
  };

  // Baseline values
  const usdrwPegPrice = 1.00; // Fixed peg at $1
  const baselineSpyPrice = spyPrice; // Live SPYX price from CoinMarketCap
  const baselineCollateral = parseFloat(spyAmount) * baselineSpyPrice;
  const baselineUsdrwMinted = parseFloat(usdrwAmount);

  // Calculate scenario adjustments (for Risk Analysis tab)
  const scenario = scenarios[activeScenario];
  // Use custom value for scenario3, otherwise use the predefined value
  const effectiveAssetChange = activeScenario === 'scenario3' 
    ? parseFloat(customScenario3) || 0 
    : scenario.assetChange;
  const adjustedSpyPrice = baselineSpyPrice * (1 + effectiveAssetChange / 100);
  const adjustedCollateral = parseFloat(spyAmount) * adjustedSpyPrice;
  const adjustedUsdrwValue = baselineUsdrwMinted * usdrwPegPrice;

  // Calculate values for Redemptions tab
  const remainingUsdrwDebt = Math.max(0, baselineUsdrwMinted - parseFloat(usdrwRepayAmount));
  const remainingSpyShares = Math.max(0, parseFloat(spyAmount) - parseFloat(spyWithdrawAmount));
  const remainingCollateralValue = remainingSpyShares * baselineSpyPrice;

  // Determine displayed values based on active tab
  let displayedCollateral = baselineCollateral;
  let displayedSpyAmount = spyAmount;
  let displayedSpyPrice = baselineSpyPrice;
  let displayedUsdrwValue = adjustedUsdrwValue;
  let displayedCollateralizationRatio = (baselineCollateral / adjustedUsdrwValue) * 100;

  if (activeTab === 'risk') {
    // Risk Analysis: show scenario-adjusted values
    displayedCollateral = adjustedCollateral;
    displayedSpyPrice = adjustedSpyPrice;
    displayedCollateralizationRatio = (adjustedCollateral / adjustedUsdrwValue) * 100;
  } else if (activeTab === 'redemptions-repay') {
    // Redemptions: show remaining after repayment
    displayedCollateral = remainingCollateralValue;
    displayedSpyAmount = remainingSpyShares.toString();
    displayedUsdrwValue = remainingUsdrwDebt * usdrwPegPrice;
    displayedCollateralizationRatio = remainingUsdrwDebt > 0 
      ? (remainingCollateralValue / (remainingUsdrwDebt * usdrwPegPrice)) * 100 
      : 0;
  }

  const liquidationThreshold = 111.11; // 90% LTV

  // Status determination
  const getStatus = (cr: number) => {
    if (cr >= 135) return { 
      label: 'SAFE', 
      color: '#10B981', 
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/30'
    };
    if (cr >= 125) return { 
      label: 'WARNING', 
      color: '#F59E0B',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30'
    };
    if (cr >= liquidationThreshold) return { 
      label: 'DANGER', 
      color: '#EF4444',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30'
    };
    return { 
      label: 'LIQUIDATION', 
      color: '#DC2626',
      bgColor: 'bg-red-600/20',
      borderColor: 'border-red-600/50'
    };
  };

  const status = getStatus(displayedCollateralizationRatio);
  const healthBarProgress = Math.min((displayedCollateralizationRatio / 200) * 100, 100);

  return (
    <div className="min-h-screen bg-[#030712] text-white overflow-auto">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gradient-to-b from-[#0a0a0a] to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Mobile: Stack vertically, Desktop: Logo centered + Wallet absolute */}
          <div className="flex flex-col sm:flex-row sm:relative items-center gap-3 sm:gap-0">
            {/* Logo - Centered on all screens */}
            <div className="flex justify-center items-center gap-3 sm:flex-1">
              <BasaltLogo className="w-10 h-10 sm:w-12 sm:h-12 text-teal-500" />
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
                <span className="text-white">BASALT</span>
                <span className="text-teal-500"> PROTOCOL</span>
              </h1>
            </div>
            
            {/* Wallet & Price Info - Below logo on mobile, top right on desktop */}
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:absolute sm:top-0 sm:right-0">
              {/* SPYX Price - Ready for live API */}
              <div className="flex items-center gap-2 px-3 py-2 border border-gray-700 rounded-lg bg-gray-900/50 backdrop-blur-sm">
                <TrendingUp className="w-3 h-3 text-emerald-400" />
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">SPYX Price</span>
                  <span className="text-sm text-teal-400 font-medium">
                    ${spyPrice.toFixed(2)}
                  </span>
                </div>
              </div>
              
              {/* Wallet */}
              <WalletMultiButton className="!bg-gray-900/50 !border !border-gray-700 !text-gray-300 hover:!bg-gray-800/50 !rounded-lg !px-4 !py-2 !text-sm" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Transaction Error Display */}
        {transactionError && (
          <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-red-400 text-sm">{transactionError}</span>
              <button 
                onClick={() => setTransactionError(null)}
                className="ml-auto text-red-400 hover:text-red-300"
              >
                ×
              </button>
            </div>
          </div>
        )}
        {/* Tabbed Interface */}
        <Tabs defaultValue="redemptions-repay" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="w-full bg-gray-900 border border-gray-800 p-1 h-auto grid grid-cols-3 rounded-lg">
            <TabsTrigger 
              value="mint-borrow" 
              className="data-[state=active]:bg-indigo-500/10 data-[state=active]:border data-[state=active]:border-indigo-500/50 data-[state=active]:text-indigo-400 text-gray-400 rounded-md transition-all text-xs sm:text-sm px-2 sm:px-4 py-2"
            >
              Mint
            </TabsTrigger>
            <TabsTrigger 
              value="redemptions-repay" 
              className="data-[state=active]:bg-teal-500/10 data-[state=active]:border data-[state=active]:border-teal-500/50 data-[state=active]:text-teal-400 text-gray-400 rounded-md transition-all text-xs sm:text-sm px-2 sm:px-4 py-2"
            >
              Portfolio
            </TabsTrigger>
            <TabsTrigger 
              value="risk" 
              className="data-[state=active]:bg-amber-500/10 data-[state=active]:border data-[state=active]:border-amber-500/50 data-[state=active]:text-amber-400 text-gray-400 rounded-md transition-all text-xs sm:text-sm px-2 sm:px-4 py-2"
            >
              <span className="sm:hidden">Analysis</span>
              <span className="hidden sm:inline">Risk Analysis</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="mint-borrow" className="mt-6">
            <div className="max-w-2xl mx-auto">
              <Card className="bg-gray-900 border-gray-800 p-4 sm:p-6 rounded-xl shadow-xl">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-1 h-6 bg-indigo-500 rounded-full" />
                  <h3 className="text-lg text-white">
                    Mint / Deposit
                  </h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="spy-deposit" className="text-sm text-gray-400 mb-2 block">
                      Mock SPYx to Deposit
                    </Label>
                    <Input
                      id="spy-deposit"
                      type="number"
                      value={spyAmount}
                      onChange={(e) => setSpyAmount(e.target.value)}
                      className="bg-gray-950 border-gray-700 text-white h-12 rounded-lg focus:border-indigo-500 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div>
                    <Label htmlFor="usdrw-mint" className="text-sm text-gray-400 mb-2 block">
                      USDrw to Mint
                    </Label>
                    <Input
                      id="usdrw-mint"
                      type="number"
                      value={usdrwAmount}
                      onChange={(e) => setUsdrwAmount(e.target.value)}
                      className="bg-gray-950 border-gray-700 text-white h-12 rounded-lg focus:border-indigo-500 focus:ring-indigo-500/20"
                    />
                  </div>

                  {/* LTV Slider */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm text-gray-400">
                        Loan-to-Value Ratio
                      </Label>
                      <span className="text-sm text-indigo-400 font-medium">
                        {ltvRatio}%
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="range"
                        min="10"
                        max="80"
                        value={ltvRatio}
                        onChange={(e) => setLtvRatio(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer slider"
                        style={{
                          background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${((ltvRatio - 10) / 70) * 100}%, #374151 ${((ltvRatio - 10) / 70) * 100}%, #374151 100%)`
                        }}
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>10%</span>
                        <span>50%</span>
                        <span>80%</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 space-y-3 text-sm border-t border-gray-800 mt-6">
                    <div className="flex justify-between text-gray-400">
                      <span>Max LTV:</span>
                      <span className="text-indigo-400 font-medium">90.00%</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>Liquidation Penalty:</span>
                      <span className="text-red-400 font-medium">1.00%</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>Est. USDrw Value:</span>
                      <span className="text-teal-400 font-medium">
                        ${adjustedUsdrwValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={handleDepositAndMint}
                    disabled={isTransacting || !connected}
                    className="w-full h-12 mt-6 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 border-0 rounded-lg shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isTransacting ? (
                      <div className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Processing...
                      </div>
                    ) : !connected ? (
                      'Connect Wallet'
                    ) : (
                      'Deposit & Mint'
                    )}
                  </Button>

                  {/* Inline Success Message */}
                  {successTransactionData && successTransactionData.type === 'deposit_mint' && (
                    <div className="mt-4 p-4 bg-green-900/40 border-2 border-green-600 rounded-lg shadow-lg backdrop-blur-sm">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-300 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <h4 className="text-green-200 font-semibold mb-2">Transaction Successful!</h4>
                          <div className="space-y-1 text-sm text-white">
                            {successTransactionData.details.collateralAmount && (
                              <p>Deposited: <span className="font-medium">{successTransactionData.details.collateralAmount} {successTransactionData.details.collateralSymbol}</span></p>
                            )}
                            {successTransactionData.details.usdrwAmount && (
                              <p>Minted: <span className="font-medium">{successTransactionData.details.usdrwAmount} {successTransactionData.details.usdrwSymbol}</span></p>
                            )}
                          </div>
                          <a
                            href={`https://explorer.solana.com/tx/${successTransactionData.signature}?cluster=devnet`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 mt-3 px-3 py-1 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-500 transition-colors font-medium"
                            onClick={(e) => e.stopPropagation()}
                          >
                            View on Solana Explorer
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        <button
                          onClick={() => setSuccessTransactionData(null)}
                          className="text-green-300 hover:text-white transition-colors p-1"
                          aria-label="Close success message"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="redemptions-repay" className="mt-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Current Position Summary */}
              <Card className="bg-gray-900 border-gray-800 p-4 sm:p-6 rounded-xl shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-6 bg-teal-500 rounded-full" />
                    <h3 className="text-lg text-white">
                      Your Position
                    </h3>
                    {accountLoading && (
                       <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />
                     )}
                   </div>
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={refreshData}
                     disabled={accountLoading}
                     className="text-gray-400 border-gray-700 hover:text-white hover:border-gray-600"
                   >
                     <RefreshCw className={`w-4 h-4 ${accountLoading ? 'animate-spin' : ''}`} />
                   </Button>
                 </div>
                 
                 {accountError && (
                   <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded-lg">
                     <p className="text-red-400 text-sm">
                       Error loading account data: {accountError}
                     </p>
                   </div>
                 )}
                
                <div className={`flex ${rowGapClass} overflow-x-auto py-2 scroll-smooth items-stretch`} id="position-row">
                  <div className="bg-gray-950 p-4 rounded-lg border border-gray-800 w-[280px] flex-shrink-0">
                    <p className="text-xs text-gray-500 mb-1">Collateral</p>
                    {!connected ? (
                      <p className="text-lg text-gray-400 font-medium mb-1">
                        Connect wallet to see data
                      </p>
                    ) : (
                      <>
                        <p className="text-2xl text-indigo-400 font-semibold mb-1">
                          {userVault ? 
                            (Number(userVault.collateralAmount) / 1e9).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) 
                            : (spyAmount && parseFloat(spyAmount) ? parseFloat(spyAmount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '0')
                          } Mock SPYx
                        </p>
                        <p className="text-xs text-gray-500">
                          ${(collateralValue || (spyAmount && parseFloat(spyAmount) ? parseFloat(spyAmount) * baselineSpyPrice : 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </>
                    )}
                  </div>
                  
                  <div className="bg-gray-950 p-4 rounded-lg border border-gray-800 w-[280px] flex-shrink-0">
                    <p className="text-xs text-gray-500 mb-1">Debt</p>
                    {!connected ? (
                      <p className="text-lg text-gray-400 font-medium mb-1">
                        Connect wallet to see data
                      </p>
                    ) : (
                      <>
                        <p className="text-2xl text-teal-400 font-semibold mb-1">
                          {userVault ? 
                            (Number(userVault.debtAmount) / 1e6).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) 
                            : (usdrwAmount && parseFloat(usdrwAmount) ? parseFloat(usdrwAmount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '0')
                          } USDrw
                        </p>
                        <p className="text-xs text-gray-500">
                          ${(debtValue || (usdrwAmount && parseFloat(usdrwAmount) ? parseFloat(usdrwAmount) * usdrwPegPrice : 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </>
                    )}
                  </div>
                  
                  <div className="bg-gray-950 p-4 rounded-lg border border-gray-800 w-[280px] flex-shrink-0">
                    <p className="text-xs text-gray-500 mb-1">Health Ratio</p>
                    {!connected ? (
                      <p className="text-lg text-gray-400 font-medium mb-1">
                        Connect wallet to see data
                      </p>
                    ) : (
                      <>
                        <p className="text-2xl font-semibold mb-1" style={{ color: status.color }}>
                          {healthRatio ? 
                            (healthRatio * 100).toFixed(0) 
                            : displayedCollateralizationRatio.toFixed(0)
                          }%
                        </p>
                        <Badge 
                          variant="outline" 
                          className="text-xs"
                          style={{ 
                            borderColor: status.color,
                            color: status.color
                          }}
                        >
                          {isLiquidatable ? 'At Risk' : status.label}
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
              </Card>

              {/* Portfolio Actions */}
              <div className={`flex ${rowGapClass} overflow-x-auto py-2 scroll-smooth items-stretch`} id="actions-row">
                {/* Deposit More Collateral */}
                <Card className="bg-gray-900 border-gray-800 p-4 sm:p-5 rounded-xl shadow-lg hover:border-indigo-500/50 transition-all w-[320px] flex-shrink-0">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-5 bg-indigo-500 rounded-full" />
                    <h4 className="text-white">
                      Deposit
                    </h4>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="spy-deposit-more" className="text-xs text-gray-400 mb-2 block">
                        Mock SPYx
                      </Label>
                      <Input
                        id="spy-deposit-more"
                        type="number"
                        placeholder="0"
                        className="bg-gray-950 border-gray-700 text-white h-10 rounded-lg focus:border-indigo-500 focus:ring-indigo-500/20"
                      />
                    </div>
                    
                    <Button
                      onClick={handleDepositMoreCollateral}
                      disabled={isTransacting || !connected}
                      className="w-full h-10 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 hover:border-indigo-500/60 text-indigo-400 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isTransacting ? (
                        <div className="flex items-center gap-2">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          Processing...
                        </div>
                      ) : !connected ? (
                        'Connect Wallet'
                      ) : (
                        'Deposit'
                      )}
                    </Button>
                  </div>
                </Card>

                {/* Repay Debt */}
                <Card className="bg-gray-900 border-gray-800 p-4 sm:p-5 rounded-xl shadow-lg hover:border-teal-500/50 transition-all w-[320px] flex-shrink-0">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-5 bg-teal-500 rounded-full" />
                    <h4 className="text-white">
                      Repay
                    </h4>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="usdrw-repay" className="text-xs text-gray-400 mb-2 block">
                        USDrw Amount
                      </Label>
                      <Input
                        id="usdrw-repay"
                        type="number"
                        value={usdrwRepayAmount}
                        onChange={(e) => setUsdrwRepayAmount(e.target.value)}
                        placeholder="0"
                        className="bg-gray-950 border-gray-700 text-white h-10 rounded-lg focus:border-teal-500 focus:ring-teal-500/20"
                      />
                    </div>
                    
                    <Button
                      onClick={handleRepayDebt}
                      disabled={isTransacting || !connected}
                      className="w-full h-10 bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/40 hover:border-teal-500/60 text-teal-400 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isTransacting ? (
                        <div className="flex items-center gap-2">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          Processing...
                        </div>
                      ) : !connected ? (
                        'Connect Wallet'
                      ) : (
                        'Repay'
                      )}
                    </Button>
                  </div>
                </Card>

                {/* Withdraw Collateral */}
                <Card className="bg-gray-900 border-gray-800 p-4 sm:p-5 rounded-xl shadow-lg hover:border-amber-500/50 transition-all w-[320px] flex-shrink-0">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-5 bg-amber-500 rounded-full" />
                    <h4 className="text-white">
                      Withdraw
                    </h4>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="spy-withdraw" className="text-xs text-gray-400 mb-2 block">
                        Mock SPYx
                      </Label>
                      <Input
                        id="spy-withdraw"
                        type="number"
                        value={spyWithdrawAmount}
                        onChange={(e) => setSpyWithdrawAmount(e.target.value)}
                        placeholder="0"
                        className="bg-gray-950 border-gray-700 text-white h-10 rounded-lg focus:border-amber-500 focus:ring-amber-500/20"
                      />
                    </div>
                    
                    <Button
                      onClick={handleWithdrawCollateral}
                      disabled={isTransacting || !publicKey}
                      className="w-full h-10 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 hover:border-amber-500/60 text-amber-400 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isTransacting ? 'Processing...' : 'Withdraw'}
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="risk" className="mt-6">
            <div className="max-w-2xl mx-auto space-y-4">
              {/* Baseline Values Display - NOW EDITABLE */}
              <Card className="bg-gray-900 border-gray-800 p-4 sm:p-6 rounded-xl shadow-xl">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-6 bg-teal-500 rounded-full" />
                  <h3 className="text-lg text-white">
                    Current Position
                  </h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500">Collateral (Mock SPYx)</p>
                    <Input
                      type="number"
                      value={spyAmount}
                      onChange={(e) => setSpyAmount(e.target.value)}
                      className="bg-gray-950 border-gray-700 text-indigo-400 h-10 rounded-lg focus:border-indigo-500 focus:ring-indigo-500/20"
                    />
                    <p className="text-xs text-gray-500">@ ${baselineSpyPrice.toFixed(2)} = ${baselineCollateral.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500">USDrw Debt</p>
                    <Input
                      type="number"
                      value={usdrwAmount}
                      onChange={(e) => setUsdrwAmount(e.target.value)}
                      className="bg-gray-950 border-gray-700 text-teal-400 h-10 rounded-lg focus:border-teal-500 focus:ring-teal-500/20"
                    />
                    <p className="text-xs text-gray-500">= ${baselineUsdrwMinted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                </div>
              </Card>

              <Card className="bg-gray-900 border-gray-800 p-4 sm:p-6 rounded-xl shadow-xl">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-1 h-6 bg-amber-500 rounded-full" />
                  <h3 className="text-lg text-white">
                    Risk Simulator
                  </h3>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  {(Object.keys(scenarios) as Scenario[]).filter(key => key !== 'scenario3' && key !== 'baseline').map((key) => {
                    const scenario = scenarios[key];
                    const isActive = activeScenario === key;
                    
                    return (
                      <Button
                        key={key}
                        onClick={() => setActiveScenario(key)}
                        className={`justify-start text-left h-auto py-3 px-3 transition-all duration-200 rounded-lg ${
                          isActive 
                            ? 'bg-teal-500/10 border-teal-500/50 text-white'
                            : 'bg-gray-950 border-gray-800 hover:border-gray-700 text-gray-300'
                        }`}
                        variant="outline"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium">
                              {scenario.name}
                            </span>
                          </div>
                          <div className="text-xs text-gray-400 flex items-center gap-1">
                            {scenario.description}
                            {scenario.assetChange < 0 && (
                              <TrendingDown className="w-3 h-3 text-red-400" />
                            )}
                            {scenario.assetChange > 0 && (
                              <TrendingUp className="w-3 h-3 text-emerald-400" />
                            )}
                          </div>
                        </div>
                      </Button>
                    );
                  })}
                  
                  {/* Scenario 3 - Custom Input */}
                  <div 
                    onClick={() => setActiveScenario('scenario3')}
                    className={`col-span-2 border rounded-lg p-3 transition-all duration-200 cursor-pointer ${
                      activeScenario === 'scenario3'
                        ? customScenario3Error
                          ? 'bg-red-500/10 border-red-500/50'
                          : 'bg-amber-500/10 border-amber-500/50'
                        : 'bg-gray-950 border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-white">
                        SCENARIO 3
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="custom-scenario" className="text-xs text-gray-400 whitespace-nowrap">
                        SPY Change:
                      </Label>
                      <div className="flex items-center gap-1 flex-1">
                        <Input
                          id="custom-scenario"
                          type="number"
                          value={customScenario3}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            setCustomScenario3(e.target.value);
                            if (value < -100 || value > 1000 || isNaN(value)) {
                              setCustomScenario3Error(true);
                            } else {
                              setCustomScenario3Error(false);
                            }
                          }}
                          onFocus={() => setActiveScenario('scenario3')}
                          min="-100"
                          max="1000"
                          step="0.1"
                          className={`bg-gray-950 h-8 rounded-lg text-sm ${
                            customScenario3Error
                              ? 'border-red-500 text-red-400 focus:border-red-500 focus:ring-red-500/20'
                              : 'border-gray-700 text-amber-400 focus:border-amber-500 focus:ring-amber-500/20'
                          }`}
                        />
                        <span className="text-xs text-gray-400">%</span>
                      </div>
                    </div>
                    {customScenario3Error && (
                      <p className="text-xs text-red-400 mt-1">Value must be between -100% and +1000%</p>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Core Metrics Row */}
        <div className={`flex ${rowGapClass} overflow-x-auto py-2 scroll-smooth items-stretch`} id="metrics-row">
          {/* Collateral Value */}
          <Card 
            className="bg-gray-900 border-gray-800 p-4 sm:p-6 relative overflow-hidden rounded-xl shadow-lg w-[480px] flex-shrink-0"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl" />
            <div className="relative z-10">
              <p className="text-sm text-gray-400 mb-2">Collateral Value</p>
              {!connected ? (
                <div className="text-2xl sm:text-3xl text-gray-500 font-medium mb-2">
                  Connect wallet to see data
                </div>
              ) : (
                <>
                  <div className="text-4xl sm:text-5xl text-indigo-400 font-semibold mb-2">
                    ${displayedCollateral.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>{displayedSpyAmount} Mock SPYx @ ${displayedSpyPrice.toFixed(2)}</span>
                    {activeTab === 'risk' && effectiveAssetChange !== 0 && (
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          effectiveAssetChange > 0 
                            ? 'border-emerald-500/30 text-emerald-400' 
                            : 'border-red-500/30 text-red-400'
                        }`}
                      >
                        {effectiveAssetChange > 0 ? '+' : ''}{effectiveAssetChange}%
                      </Badge>
                    )}
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* Vault Health */}
          <Card 
            className={`bg-gray-900 p-4 sm:p-6 relative overflow-hidden rounded-xl shadow-lg w-[480px] flex-shrink-0 ${connected ? status.borderColor : 'border-gray-800'}`}
          >
            <div 
              className={`absolute top-0 right-0 w-32 h-32 ${connected ? status.bgColor : 'bg-gray-500/5'} rounded-full blur-3xl`}
            />
            <div className="relative z-10">
              <p className="text-sm text-gray-400 mb-2">Vault Health (CR)</p>
              {!connected ? (
                <div className="text-2xl sm:text-3xl text-gray-500 font-medium mb-2">
                  Connect wallet to see data
                </div>
              ) : (
                <>
                  <div 
                    className="text-4xl sm:text-5xl font-semibold mb-2"
                    style={{ color: status.color }}
                  >
                    {displayedCollateralizationRatio.toFixed(2)}%
                  </div>
                  <Badge 
                    variant="outline" 
                    className="text-xs"
                    style={{ 
                      borderColor: status.color,
                      color: status.color
                    }}
                  >
                    {status.label}
                  </Badge>
                </>
              )}
            </div>
          </Card>
        </div>


      </div>
      

    </div>
  );
}
