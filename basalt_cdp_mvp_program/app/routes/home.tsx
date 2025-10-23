import { useState, useEffect } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { AlertTriangle, TrendingUp, TrendingDown, Wallet, Shield, RefreshCw } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useCdpActions } from '../solana/useCdpActions';
import { useCdpState } from '../solana/useCdpState';

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

export default function Home() {
  const { connected } = useWallet();
  const { mintUsdrw, redeemCollateral } = useCdpActions();
  const { vault } = useCdpState();

  // State for tabs
  const [activeTab, setActiveTab] = useState<'mint-borrow' | 'redemptions-repay' | 'risk'>('mint-borrow');

  // State for mint/borrow
  const [spyAmount, setSpyAmount] = useState('100');
  const [usdrwAmount, setUsdrwAmount] = useState('40000');
  const [mintLoading, setMintLoading] = useState(false);
  
  // Mock data for demonstration (replace with actual vault data)
  const spyPrice = 550;
  const collateralizationRatio = 150;
  const totalCollateral = parseFloat(spyAmount) || 0;
  const totalDebt = parseFloat(usdrwAmount) || 0;

  // State for repay/withdraw
  const [repayUsdrwAmount, setRepayUsdrwAmount] = useState('');
  const [withdrawSpyAmount, setWithdrawSpyAmount] = useState('');
  const [repayLoading, setRepayLoading] = useState(false);

  // State for risk simulation
  const [activeScenario, setActiveScenario] = useState<Scenario>('baseline');
  const [customScenario3, setCustomScenario3] = useState('-20');
  const [customScenario3Error, setCustomScenario3Error] = useState(false);

  // Baseline values (current state)
  const baselineSpyPrice = spyPrice || 450;
  const baselineSpyAmount = parseFloat(spyAmount) || 100;
  const baselineCollateral = baselineSpyAmount * baselineSpyPrice;
  const baselineUsdrwMinted = parseFloat(usdrwAmount) || 30000;

  // Calculate effective asset change based on active scenario
  const effectiveAssetChange = activeScenario === 'scenario3' 
    ? parseFloat(customScenario3) || -20
    : scenarios[activeScenario].assetChange;

  // Calculate displayed values based on active scenario
  const displayedSpyPrice = activeTab === 'risk' 
    ? baselineSpyPrice * (1 + effectiveAssetChange / 100)
    : baselineSpyPrice;
  
  const displayedSpyAmount = activeTab === 'risk' ? baselineSpyAmount : (parseFloat(spyAmount) || 0);
  const displayedCollateral = displayedSpyAmount * displayedSpyPrice;
  
  // Calculate collateralization ratio
  const displayedCollateralizationRatio = activeTab === 'risk' && baselineUsdrwMinted > 0
    ? (displayedCollateral / baselineUsdrwMinted) * 100
    : collateralizationRatio || 150;

  // Determine vault health status
  const getVaultStatus = (cr: number) => {
    if (cr >= 200) {
      return {
        label: 'HEALTHY',
        color: '#10b981',
        bgColor: 'bg-emerald-500/5',
        borderColor: 'border-emerald-500/20'
      };
    } else if (cr >= 150) {
      return {
        label: 'MODERATE',
        color: '#f59e0b',
        bgColor: 'bg-amber-500/5',
        borderColor: 'border-amber-500/20'
      };
    } else if (cr >= 110) {
      return {
        label: 'AT RISK',
        color: '#ef4444',
        bgColor: 'bg-red-500/5',
        borderColor: 'border-red-500/20'
      };
    } else {
      return {
        label: 'LIQUIDATION',
        color: '#dc2626',
        bgColor: 'bg-red-600/10',
        borderColor: 'border-red-600/30'
      };
    }
  };

  const status = getVaultStatus(displayedCollateralizationRatio);

  // Handle mint/borrow action
  const handleMintUsdrw = async () => {
    if (!connected) {
      alert('Please connect your wallet first');
      return;
    }

    const usdrwAmountNum = parseFloat(usdrwAmount);

    if (isNaN(usdrwAmountNum) || usdrwAmountNum <= 0) {
      alert('Please enter a valid USDrw amount');
      return;
    }

    setMintLoading(true);
    try {
      await mintUsdrw(usdrwAmountNum);
      alert('Transaction successful!');
      // Reset form
      setSpyAmount('100');
      setUsdrwAmount('40000');
    } catch (error) {
      console.error('Transaction failed:', error);
      alert('Transaction failed. Please try again.');
    } finally {
      setMintLoading(false);
    }
  };

  // Handle repay/withdraw action
  const handleRepayUsdrw = async () => {
    if (!connected) {
      alert('Please connect your wallet first');
      return;
    }

    const withdrawAmountNum = parseFloat(withdrawSpyAmount);

    if (isNaN(withdrawAmountNum) || withdrawAmountNum <= 0) {
      alert('Please enter a valid SPY withdraw amount');
      return;
    }

    setRepayLoading(true);
    try {
      await redeemCollateral(withdrawAmountNum);
      alert('Repayment successful!');
      // Reset form
      setRepayUsdrwAmount('0');
      setWithdrawSpyAmount('0');
    } catch (error) {
      console.error('Repayment failed:', error);
      alert('Repayment failed. Please try again.');
    } finally {
      setRepayLoading(false);
    }
  };

  return (
    <div className="dark min-h-screen" style={{ backgroundColor: 'var(--basalt-bg-primary)', color: 'var(--foreground)' }}>
      {/* Header */}
      <div className="border-b backdrop-blur-sm" style={{ borderColor: 'var(--basalt-border)', backgroundColor: 'var(--basalt-bg-secondary)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-blue-500 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-teal-400 to-blue-400 bg-clip-text text-transparent">
                  BASALT CDP
                </h1>
                <p className="text-xs text-gray-500">Collateralized Debt Position</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-gray-400">Devnet</span>
              </div>
              <WalletMultiButton className="!bg-teal-600 hover:!bg-teal-700 !rounded-lg !h-10 !px-4 !text-sm !font-medium transition-colors" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Action Tabs */}
        <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as 'mint-borrow' | 'redemptions-repay' | 'risk')} className="w-full">
          <TabsList className="grid w-full grid-cols-3 border rounded-xl p-1" style={{ backgroundColor: 'var(--basalt-bg-card)', borderColor: 'var(--basalt-border)' }}>
            <TabsTrigger 
              value="mint-borrow" 
              className="data-[state=active]:bg-teal-500/10 data-[state=active]:text-teal-400 data-[state=active]:border-teal-500/50 rounded-lg transition-all"
            >
              <Wallet className="w-4 h-4 mr-2" />
              Mint / Borrow
            </TabsTrigger>
            <TabsTrigger 
              value="redemptions-repay"
              className="data-[state=active]:bg-blue-500/10 data-[state=active]:text-blue-400 data-[state=active]:border-blue-500/50 rounded-lg transition-all"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Repay / Withdraw
            </TabsTrigger>
            <TabsTrigger 
              value="risk"
              className="data-[state=active]:bg-amber-500/10 data-[state=active]:text-amber-400 data-[state=active]:border-amber-500/50 rounded-lg transition-all"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Risk Analysis
            </TabsTrigger>
          </TabsList>

          {/* Mint/Borrow Tab */}
          <TabsContent value="mint-borrow" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-4 sm:p-6 rounded-xl shadow-xl" style={{ backgroundColor: 'var(--basalt-bg-card)', borderColor: 'var(--basalt-border)' }}>
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-1 h-6 bg-teal-500 rounded-full" />
                  <h3 className="text-lg text-white">
                    Deposit & Mint
                  </h3>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="spy-deposit" className="text-sm text-gray-300">
                      SPY Shares to Deposit
                    </Label>
                    <Input
                      id="spy-deposit"
                      type="number"
                      value={spyAmount}
                      onChange={(e) => setSpyAmount(e.target.value)}
                      placeholder="0"
                      className="bg-gray-950 border-gray-700 text-teal-400 h-12 rounded-lg focus:border-teal-500 focus:ring-teal-500/20"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="usdrw-mint" className="text-sm text-gray-300">
                      USDrw to Mint
                    </Label>
                    <Input
                      id="usdrw-mint"
                      type="number"
                      value={usdrwAmount}
                      onChange={(e) => setUsdrwAmount(e.target.value)}
                      placeholder="0"
                      className="bg-gray-950 border-gray-700 text-teal-400 h-12 rounded-lg focus:border-teal-500 focus:ring-teal-500/20"
                    />
                  </div>
                  
                  <Button 
                    onClick={handleMintUsdrw}
                    disabled={!connected || mintLoading}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white h-12 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {!connected ? 'Connect Wallet' : mintLoading ? 'Processing...' : 'Execute Transaction'}
                  </Button>
                </div>
              </Card>

              <Card className="bg-gray-900 border-gray-800 p-4 sm:p-6 rounded-xl shadow-xl">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-1 h-6 bg-gray-500 rounded-full" />
                  <h3 className="text-lg text-white">
                    Transaction Details
                  </h3>
                </div>
                
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Max LTV</span>
                    <span className="text-white">90%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Liquidation Penalty</span>
                    <span className="text-white">10%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Est. USDrw Value</span>
                    <span className="text-teal-400">${parseFloat(usdrwAmount || '0').toLocaleString()}</span>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Repay/Withdraw Tab */}
          <TabsContent value="redemptions-repay" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-900 border-gray-800 p-4 sm:p-6 rounded-xl shadow-xl">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-1 h-6 bg-blue-500 rounded-full" />
                  <h3 className="text-lg text-white">
                    Repay & Withdraw
                  </h3>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="usdrw-repay" className="text-sm text-gray-300">
                      USDrw to Repay
                    </Label>
                    <Input
                      id="usdrw-repay"
                      type="number"
                      value={repayUsdrwAmount}
                      onChange={(e) => setRepayUsdrwAmount(e.target.value)}
                      placeholder="0"
                      className="bg-gray-950 border-gray-700 text-blue-400 h-12 rounded-lg focus:border-blue-500 focus:ring-blue-500/20"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="spy-withdraw" className="text-sm text-gray-300">
                      SPY Shares to Withdraw
                    </Label>
                    <Input
                      id="spy-withdraw"
                      type="number"
                      value={withdrawSpyAmount}
                      onChange={(e) => setWithdrawSpyAmount(e.target.value)}
                      placeholder="0"
                      className="bg-gray-950 border-gray-700 text-blue-400 h-12 rounded-lg focus:border-blue-500 focus:ring-blue-500/20"
                    />
                  </div>
                  
                  <Button 
                    onClick={handleRepayUsdrw}
                    disabled={!connected || repayLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {!connected ? 'Connect Wallet' : repayLoading ? 'Processing...' : 'Execute Repayment'}
                  </Button>
                </div>
              </Card>

              <Card className="bg-gray-900 border-gray-800 p-4 sm:p-6 rounded-xl shadow-xl">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-1 h-6 bg-gray-500 rounded-full" />
                  <h3 className="text-lg text-white">
                    Current Position
                  </h3>
                </div>
                
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Current Debt</span>
                    <span className="text-white">${totalDebt?.toLocaleString() || '0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Available Collateral</span>
                    <span className="text-white">{(totalCollateral || 0).toFixed(2)} SPY</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Collateral Value</span>
                    <span className="text-blue-400">${((totalCollateral || 0) * baselineSpyPrice).toLocaleString()}</span>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Risk Analysis Tab */}
          <TabsContent value="risk" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-900 border-gray-800 p-4 sm:p-6 rounded-xl shadow-xl">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-1 h-6 bg-amber-500 rounded-full" />
                  <h3 className="text-lg text-white">
                    Position Parameters
                  </h3>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500">SPY Shares</p>
                    <Input
                      type="number"
                      value={spyAmount}
                      onChange={(e) => setSpyAmount(e.target.value)}
                      className="bg-gray-950 border-gray-700 text-amber-400 h-10 rounded-lg focus:border-amber-500 focus:ring-amber-500/20"
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