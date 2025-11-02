import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { CheckCircle, ExternalLink, Copy } from 'lucide-react';

interface SuccessTransactionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  transactionSignature: string;
  transactionType: 'deposit_mint' | 'redeem_collateral' | 'repay_debt' | 'deposit_more';
  details: {
    collateralAmount?: number;
    usdrwAmount?: number;
    collateralSymbol?: string;
    usdrwSymbol?: string;
  };
  cluster?: 'devnet' | 'mainnet-beta' | 'testnet';
}

export function SuccessTransactionDialog({
  isOpen,
  onClose,
  transactionSignature,
  transactionType,
  details,
  cluster = 'devnet'
}: SuccessTransactionDialogProps) {
  const getTransactionTypeDisplay = () => {
    switch (transactionType) {
      case 'deposit_mint':
        return {
          title: 'Deposit & Mint Successful!',
          description: 'Your collateral has been deposited and USDrw has been minted to your wallet.',
          icon: '🎉'
        };
      case 'redeem_collateral':
        return {
          title: 'Collateral Redeemed!',
          description: 'Your collateral has been successfully redeemed.',
          icon: '💰'
        };
      case 'repay_debt':
        return {
          title: 'Debt Repaid!',
          description: 'Your USDrw debt has been successfully repaid.',
          icon: '✅'
        };
      case 'deposit_more':
        return {
          title: 'Additional Deposit Successful!',
          description: 'Additional collateral has been deposited to your vault.',
          icon: '📈'
        };
      default:
        return {
          title: 'Transaction Successful!',
          description: 'Your transaction has been processed successfully.',
          icon: '✅'
        };
    }
  };

  const getExplorerUrl = () => {
    const baseUrl = cluster === 'mainnet-beta' 
      ? 'https://explorer.solana.com' 
      : `https://explorer.solana.com?cluster=${cluster}`;
    return `${baseUrl}/tx/${transactionSignature}`;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const formatSignature = (signature: string) => {
    if (signature.length <= 16) return signature;
    return `${signature.slice(0, 8)}...${signature.slice(-8)}`;
  };

  const typeDisplay = getTransactionTypeDisplay();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <DialogTitle className="text-xl font-semibold text-green-600 dark:text-green-400">
            {typeDisplay.icon} {typeDisplay.title}
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-300">
            {typeDisplay.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Transaction Details */}
          {(details.collateralAmount || details.usdrwAmount) && (
            <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-4 space-y-2">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Transaction Details
              </h4>
              {details.collateralAmount && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    {transactionType === 'deposit_mint' ? 'Deposited:' : 'Amount:'}
                  </span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {details.collateralAmount} {details.collateralSymbol || 'SPYx'}
                  </span>
                </div>
              )}
              {details.usdrwAmount && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    {transactionType === 'deposit_mint' ? 'Minted:' : 'Repaid:'}
                  </span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {details.usdrwAmount} {details.usdrwSymbol || 'USDrw'}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Transaction Signature */}
          <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Transaction Signature
              </h4>
              <Badge variant="secondary" className="text-xs">
                {cluster.toUpperCase()}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs font-mono text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900 rounded px-2 py-1 border">
                {formatSignature(transactionSignature)}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(transactionSignature)}
                className="h-8 w-8 p-0"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => window.open(getExplorerUrl(), '_blank')}
            className="w-full sm:w-auto"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View on Solana Explorer
          </Button>
          <Button onClick={onClose} className="w-full sm:w-auto">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}