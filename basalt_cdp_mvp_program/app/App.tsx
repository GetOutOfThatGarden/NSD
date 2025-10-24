import { useState, useEffect } from 'react';
import { Card } from './components/ui/card';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Badge } from './components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { AlertTriangle, TrendingUp, TrendingDown, Wallet, Shield, RefreshCw } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useCdpActions } from './solana/useCdpActions';
import { useCdpState } from './solana/useCdpState';
import { SWRProvider } from './providers/SWRProvider';

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

function AppContent() {
  // Solana wallet and CDP integration
  const { connected, publicKey } = useWallet();
  const cdpActions = useCdpActions();
  const { vault, protocolConfig, loading: cdpLoading } = useCdpState();

  const [activeScenario, setActiveScenario] = useState<Scenario>('baseline');
  const [spyAmount, setSpyAmount] = useState('100');
  const [usdrwAmount, setUsdrwAmount] = useState('40000');
  const [activeTab, setActiveTab] = useState('mint-borrow');
  const [usdrwRepayAmount, setUsdrwRepayAmount] = useState('0');
  const [spyWithdrawAmount, setSpyWithdrawAmount] = useState('0');
  const [customScenario3, setCustomScenario3] = useState('-20');
  const [customScenario3Error, setCustomScenario3Error] = useState(false);
  
  // Live price data - Ready for API integration
  const [spyPrice, setSpyPrice] = useState<number>(550); // Static price - replace with API data
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Transaction loading states
  const [mintLoading, setMintLoading] = useState(false);
  const [repayLoading, setRepayLoading] = useState(false);

  // CDP Action Handlers
  const handleMintUsdrw = async () => {
    if (!connected || !cdpActions) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      setMintLoading(true);
      const spyAmountNum = parseFloat(spyAmount);
      const usdrwAmountNum = parseFloat(usdrwAmount);
      
      if (isNaN(spyAmountNum) || isNaN(usdrwAmountNum) || spyAmountNum <= 0 || usdrwAmountNum <= 0) {
        alert('Please enter valid amounts');
        return;
      }

      await cdpActions.mintUsdrw(usdrwAmountNum);
      alert('Transaction successful!');
    } catch (error) {
      console.error('Mint transaction failed:', error);
      alert('Transaction failed. Please try again.');
    } finally {
      setMintLoading(false);
    }
  };

  const handleRepayUsdrw = async () => {
    if (!connected || !cdpActions) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      setRepayLoading(true);
      const repayAmountNum = parseFloat(usdrwRepayAmount);
      const withdrawAmountNum = parseFloat(spyWithdrawAmount);
      
      if (isNaN(repayAmountNum) || repayAmountNum <= 0) {
        alert('Please enter a valid repay amount');
        return;
      }

      await cdpActions.redeemCollateral(repayAmountNum);
      alert('Repayment successful!');
    } catch (error) {
      console.error('Repay transaction failed:', error);
      alert('Transaction failed. Please try again.');
    } finally {
      setRepayLoading(false);
    }
  };

  // TODO: Implement real API integration
  // CoinMarketCap API requires a backend proxy to avoid CORS issues
  // API endpoint: https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=SPYX
  // API Key: 2fe22964-442d-4363-a056-2439e6455be2
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
              <Shield className="w-10 h-10 sm:w-12 sm:h-12 text-teal-500" strokeWidth={1.5} />
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
              <div className="flex items-center gap-2">
                {connected && publicKey ? (
                  <div className="flex items-center gap-2 px-4 py-2 border border-gray-700 rounded-lg bg-gray-900/50 backdrop-blur-sm">
                    <Wallet className="w-4 h-4 text-indigo-400" />
                    <span className="text-sm text-gray-300">
                      {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
                    </span>
                  </div>
                ) : (
                  <WalletMultiButton className="!bg-indigo-600 hover:!bg-indigo-700 !border-indigo-500 !text-white !text-sm !px-4 !py-2 !rounded-lg" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Tabbed Interface */}
        <Tabs defaultValue="mint-borrow" className="w-full" onValueChange={setActiveTab}>
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
              Repay
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
                    Mint / Borrow
                  </h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="spy-deposit" className="text-sm text-gray-400 mb-2 block">
                      SPY Shares to Deposit
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
                    onClick={handleMintUsdrw}
                    disabled={!connected || mintLoading}
                    className="w-full h-12 mt-6 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 border-0 rounded-lg shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {mintLoading ? 'Processing...' : connected ? 'Execute Transaction' : 'Connect Wallet'}
                  </Button>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="redemptions-repay" className="mt-6">
            <div className="max-w-2xl mx-auto">
              <Card className="bg-gray-900 border-gray-800 p-4 sm:p-6 rounded-xl shadow-xl">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-1 h-6 bg-teal-500 rounded-full" />
                  <h3 className="text-lg text-white">
                    Redemptions / Repay
                  </h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="usdrw-repay" className="text-sm text-gray-400 mb-2 block">
                      USDrw to Repay
                    </Label>
                    <Input
                      id="usdrw-repay"
                      type="number"
                      value={usdrwRepayAmount}
                      onChange={(e) => setUsdrwRepayAmount(e.target.value)}
                      className="bg-gray-950 border-gray-700 text-white h-12 rounded-lg focus:border-teal-500 focus:ring-teal-500/20"
                    />
                  </div>

                  <div>
                    <Label htmlFor="spy-withdraw" className="text-sm text-gray-400 mb-2 block">
                      SPY Shares to Withdraw
                    </Label>
                    <Input
                      id="spy-withdraw"
                      type="number"
                      value={spyWithdrawAmount}
                      onChange={(e) => setSpyWithdrawAmount(e.target.value)}
                      className="bg-gray-950 border-gray-700 text-white h-12 rounded-lg focus:border-teal-500 focus:ring-teal-500/20"
                    />
                  </div>

                  <div className="pt-4 space-y-3 text-sm border-t border-gray-800 mt-6">
                    <div className="flex justify-between text-gray-400">
                      <span>Current Debt:</span>
                      <span className="text-teal-400 font-medium">
                        {parseFloat(usdrwAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDrw
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>Available Collateral:</span>
                      <span className="text-indigo-400 font-medium">
                        {spyAmount} SPY
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>Collateral Value:</span>
                      <span className="text-indigo-400 font-medium">
                        ${adjustedCollateral.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={handleRepayUsdrw}
                    disabled={!connected || repayLoading}
                    className="w-full h-12 mt-6 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-600 border-0 rounded-lg shadow-lg shadow-teal-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {repayLoading ? 'Processing...' : connected ? 'Execute Repayment' : 'Connect Wallet'}
                  </Button>
                </div>
              </Card>
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
                    <p className="text-xs text-gray-500">Collateral (SPY)</p>
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
                      <AlertTriangle className={`w-3 h-3 ${customScenario3Error ? 'text-red-400' : 'text-amber-400'}`} />
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

        {/* Core Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Collateral Value */}
          <Card 
            className="bg-gray-900 border-gray-800 p-4 sm:p-6 relative overflow-hidden rounded-xl shadow-lg"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl" />
            <div className="relative z-10">
              <p className="text-sm text-gray-400 mb-2">Collateral Value</p>
              <div className="text-4xl sm:text-5xl text-indigo-400 font-semibold mb-2">
                ${displayedCollateral.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>{displayedSpyAmount} SPY @ ${displayedSpyPrice.toFixed(2)}</span>
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
            </div>
          </Card>

          {/* Vault Health */}
          <Card 
            className={`bg-gray-900 p-4 sm:p-6 relative overflow-hidden rounded-xl shadow-lg ${status.borderColor}`}
          >
            <div 
              className={`absolute top-0 right-0 w-32 h-32 ${status.bgColor} rounded-full blur-3xl`}
            />
            <div className="relative z-10">
              <p className="text-sm text-gray-400 mb-2">Vault Health (CR)</p>
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
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <SWRProvider>
      <AppContent />
    </SWRProvider>
  );
}
