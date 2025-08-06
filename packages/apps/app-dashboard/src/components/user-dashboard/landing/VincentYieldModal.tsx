import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/shared/ui/dialog';
import { Button } from '@/components/shared/ui/button';
import { Copy, RefreshCw, ExternalLink } from 'lucide-react';
import { useFetchUsdcBalance } from '@/hooks/user-dashboard/dashboard/useFetchUsdcBalance';
import { env } from '@/config/env';
import { theme } from '../connect/ui/theme';

interface VincentYieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentPkpAddress: string;
}

export function VincentYieldModal({ isOpen, onClose, agentPkpAddress }: VincentYieldModalProps) {
  const [copied, setCopied] = useState(false);

  // Fetch USDC balance for the PKP address
  const {
    balanceFormatted,
    isLoading: balanceLoading,
    error: balanceError,
    refetch: refetchBalance,
  } = useFetchUsdcBalance({
    address: agentPkpAddress,
  });

  const handleGetStarted = () => {
    window.open(
      `https://dashboard.heyvincent.ai/user/appId/${env.VITE_VINCENT_YIELD_APPID}/connect?redirectUri=${encodeURIComponent('https://yield.heyvincent.ai')}`,
      '_blank',
    );
  };

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(agentPkpAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={`w-full max-w-2xl ${theme.mainCard} border ${theme.mainCardBorder} max-h-[80vh] overflow-y-auto font-[system-ui,Avenir,Helvetica,Arial,sans-serif]`}
      >
        <DialogHeader className="pb-6">
          <DialogTitle className={`text-2xl font-bold ${theme.text} mb-2`}>
            Vincent (Early Access) — Now Live! 🚀
          </DialogTitle>
          <DialogDescription className={`text-base ${theme.textMuted} leading-relaxed`}>
            Vincent introduces the next wave of user-owned finance and agent-driven automation for
            Web3. Today, anyone can use Vincent to automate interactions with a range of DeFi
            applications, starting with Morpho Vaults.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className={`p-6 rounded-xl ${theme.cardBg} border ${theme.cardBorder}`}>
            <h3 className={`text-xl font-semibold ${theme.text} mb-4`}>
              Try <span className="text-orange-600">Vincent Yield</span> to Get Started
            </h3>
            <p className={`text-sm ${theme.textMuted} leading-relaxed`}>
              Yincent Yield allows you to have your funds automatically routed into the
              highest-yielding{' '}
              <a
                href="https://morpho.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="!text-orange-600 hover:underline"
              >
                Morpho
              </a>{' '}
              vaults. To get started, deposit at least $50 of USDC on Base mainnet, then connect and
              activate the application.
            </p>
          </div>

          {/* Agent Address Section */}
          <div>
            <h4 className={`text-lg font-semibold ${theme.text} mb-3`}>Your Agent Address</h4>
            <div
              className={`flex items-center gap-3 p-4 ${theme.itemBg} border ${theme.cardBorder} rounded-lg`}
            >
              <code className={`flex-1 text-sm font-mono break-all ${theme.text}`}>
                {agentPkpAddress}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyAddress}
                className={`flex items-center gap-2 shrink-0 ${theme.itemBg} ${theme.text} border ${theme.cardBorder} hover:${theme.itemHoverBg}`}
              >
                <Copy className="h-4 w-4" />
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>

            {/* Balance and BaseScan link */}
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2">
                <span className={`text-sm ${theme.textMuted}`}>Balance:</span>
                {balanceLoading ? (
                  <span className={`text-sm ${theme.textMuted}`}>Loading...</span>
                ) : balanceError ? (
                  <button
                    onClick={refetchBalance}
                    className="text-sm text-red-500 hover:text-red-700 underline"
                  >
                    Error - retry
                  </button>
                ) : (
                  <>
                    <span className="text-sm font-mono font-medium text-green-600 dark:text-green-400">
                      ${balanceFormatted || '0.00'} USDC
                    </span>
                    <button
                      onClick={refetchBalance}
                      className={`p-1 hover:${theme.itemHoverBg} rounded ${theme.textMuted} hover:${theme.text}`}
                      title="Refresh balance"
                    >
                      <RefreshCw className="h-3 w-3" />
                    </button>
                  </>
                )}
              </div>
              <a
                href={`https://basescan.org/address/${agentPkpAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`text-xs ${theme.linkColor} flex items-center gap-1`}
              >
                View on BaseScan <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          {/* Instructions */}
          <div>
            <h4 className={`text-lg font-semibold ${theme.text} mb-3`}>How to Deposit</h4>
            <ol className={`list-decimal list-inside space-y-2 text-sm ${theme.textMuted} ml-2`}>
              <li>Copy the agent address above</li>
              <li>Open your wallet (MetaMask, Coinbase Wallet, etc.)</li>
              <li>Switch to Base network</li>
              <li>Send USDC to the copied address</li>
              <li>Activate the application</li>
            </ol>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-8 border-t border-gray-100 dark:border-white/10">
          <Button
            onClick={onClose}
            variant="outline"
            className={`${theme.itemBg} ${theme.text} border ${theme.cardBorder} hover:${theme.itemHoverBg}`}
          >
            Close
          </Button>
          <Button
            onClick={handleGetStarted}
            className="bg-orange-600 hover:bg-orange-700 text-white font-medium"
          >
            Get Started
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
