import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/shared/ui/dialog';
import { Button } from '@/components/shared/ui/button';
import { Copy, RefreshCw } from 'lucide-react';
import { useFetchUsdcBalance } from '@/hooks/user-dashboard/dashboard/useFetchUsdcBalance';
import { env } from '@/config/env';
import { theme } from '../connect/ui/theme';
import QRCode from 'react-qr-code';

interface VincentYieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentPkpAddress: string;
}

const MINIMUM_DEPOSIT = 50;

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

  const currentBalance = parseFloat(balanceFormatted || '0');
  const progressPercentage = (currentBalance / MINIMUM_DEPOSIT) * 100;
  const amountNeeded = Math.max(0, MINIMUM_DEPOSIT - currentBalance);

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
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        button[class*="absolute top-4 right-4"] {
          opacity: 0.15 !important;
        }
        button[class*="absolute top-4 right-4"]:hover {
          opacity: 0.4 !important;
        }
      `}</style>
      <DialogContent
        className={`w-full max-w-[calc(100%-1rem)] sm:max-w-2xl lg:!max-w-4xl !rounded-none ${theme.mainCard} border ${theme.mainCardBorder}`}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="pb-8 border-b border-gray-200 dark:border-gray-700">
          <DialogTitle className={`text-3xl font-medium tracking-tight ${theme.text} mb-2`}>
            Welcome to Vincent
          </DialogTitle>
          <div
            className="text-sm uppercase tracking-widest font-medium mb-4"
            style={{ color: '#ff722c' }}
          >
            EARLY ACCESS
          </div>
          <DialogDescription
            className={`text-lg ${theme.textMuted} leading-relaxed font-normal text-center`}
          >
            Vincent powers the next wave of user-owned finance and agent-driven automation for Web3.
            <br />
            Deposit at least 50 USDC to get started with Vincent Yield:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8 pt-2">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-2 h-2 bg-gray-400"></div>
              <h4 className={`text-sm ${theme.textMuted} font-medium`}>
                Your Vincent Wallet Address
              </h4>
            </div>

            {/* QR Code centered above address */}
            <div className="flex justify-center mb-4">
              <div className="p-2 bg-orange-50/60 dark:bg-orange-900/25">
                <div className="w-24 h-24 flex items-center justify-center relative">
                  <QRCode
                    value={agentPkpAddress}
                    size={96}
                    style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
                    viewBox={`0 0 96 96`}
                    level="H"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white rounded-full p-1 w-6 h-6 flex items-center justify-center shadow-sm">
                      <img
                        src="/orange-v-logo.svg"
                        alt="Vincent V"
                        className="w-4 h-4 object-contain"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Agent Address below QR code */}
            <div className="flex justify-center">
              <div className="flex items-center gap-3 px-2 py-1 bg-orange-50/60 dark:bg-orange-900/25">
                <code
                  className={`flex-1 text-xs font-mono font-normal whitespace-nowrap ${theme.text} tracking-wide text-center`}
                >
                  {agentPkpAddress}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyAddress}
                  className={`flex items-center gap-1 shrink-0 bg-orange-50/60 hover:bg-orange-100/60 ${theme.text} border border-orange-200/60 hover:border-orange-300/80 transition-all duration-200 font-normal text-xs px-2 py-1`}
                  style={{ borderRadius: '0px' }}
                >
                  <Copy className="h-2.5 w-2.5" />
                  {copied ? 'Copied' : 'Copy Address'}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <div className={`text-sm ${theme.textMuted} font-medium`}>Balance</div>
                  {balanceLoading ? (
                    <div className="p-1">
                      <RefreshCw className="h-3 w-3 text-orange-500 animate-spin" />
                    </div>
                  ) : !balanceError ? (
                    <button
                      onClick={refetchBalance}
                      className={`p-1 hover:${theme.itemHoverBg} ${theme.textMuted} hover:${theme.text} transition-all duration-200`}
                      title="Refresh balance"
                    >
                      <RefreshCw className="h-3 w-3" />
                    </button>
                  ) : null}
                  {balanceError && (
                    <button
                      onClick={refetchBalance}
                      className="text-sm text-red-500 hover:text-red-400 font-normal transition-colors"
                    >
                      Error - Retry
                    </button>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className={theme.textMuted}>
                      ${balanceFormatted || '0.00'} / $50.00 USDC
                    </span>
                    {currentBalance < MINIMUM_DEPOSIT && (
                      <span style={{ color: '#ff722c' }}>${amountNeeded.toFixed(2)} needed</span>
                    )}
                  </div>
                  <div className="h-1.5 bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    <div
                      className="h-full transition-all duration-500 ease-out"
                      style={{
                        width: `${Math.min(progressPercentage, 100)}%`,
                        backgroundColor: currentBalance >= MINIMUM_DEPOSIT ? '#fbbf24' : '#ff722c',
                        ...(currentBalance >= MINIMUM_DEPOSIT && {
                          backgroundImage:
                            'linear-gradient(90deg, #fbbf24 0%, #ffffff60 50%, #fbbf24 100%)',
                          backgroundSize: '200% 100%',
                          animation: 'shimmer 2s linear infinite',
                        }),
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center pt-8 border-t border-gray-200 dark:border-gray-700">
          <Button
            onClick={handleGetStarted}
            disabled={!balanceFormatted || parseFloat(balanceFormatted) < MINIMUM_DEPOSIT}
            className={`px-12 py-3 font-normal tracking-wide transition-all duration-200 border text-white ${
              !balanceFormatted || parseFloat(balanceFormatted) < MINIMUM_DEPOSIT
                ? 'bg-gray-100 dark:bg-gray-800 !text-gray-400 border-gray-200 dark:border-gray-700 cursor-not-allowed'
                : ''
            }`}
            style={{
              borderRadius: '0px',
              ...(!balanceFormatted || parseFloat(balanceFormatted) < MINIMUM_DEPOSIT
                ? {}
                : {
                    backgroundColor: '#ff722c',
                    borderColor: '#ff722c',
                  }),
            }}
          >
            Activate Vincent Yield
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
