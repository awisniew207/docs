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
        @media (max-width: 420px) {
          [data-slot="dialog-content"] {
            max-width: 98vw !important;
            max-height: 98vh !important;
            margin: 1vw !important;
            padding: 1rem !important;
          }
          .ultra-compact-title {
            font-size: 1.25rem !important;
            line-height: 1.3 !important;
            margin-bottom: 0.25rem !important;
          }
          .ultra-compact-desc {
            font-size: 0.875rem !important;
            line-height: 1.4 !important;
          }
          .ultra-compact-spacing {
            padding-top: 0.5rem !important;
            padding-bottom: 0.5rem !important;
          }
          .ultra-compact-gap {
            gap: 0.5rem !important;
          }
        }
      `}</style>
      <DialogContent
        className={`w-full max-w-[95vw] max-h-[95vh] sm:max-w-2xl sm:max-h-[90vh] lg:!max-w-4xl !rounded-none ${theme.mainCard} border ${theme.mainCardBorder} overflow-y-auto`}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="pb-3 sm:pb-4 md:pb-8 border-b border-gray-200 dark:border-gray-700 ultra-compact-spacing">
          <DialogTitle
            className={`text-xl sm:text-2xl md:text-3xl font-medium tracking-tight ${theme.text} mb-1 sm:mb-2 ultra-compact-title`}
          >
            Welcome to Vincent
          </DialogTitle>
          <div
            className="text-sm uppercase tracking-widest font-medium mb-4"
            style={{ color: '#ff722c' }}
          >
            EARLY ACCESS
          </div>
          <DialogDescription
            className={`text-sm sm:text-base md:text-lg ${theme.textMuted} leading-relaxed font-normal text-center px-2 sm:px-0 ultra-compact-desc`}
          >
            Vincent powers the next wave of user-owned finance and agent-driven automation for Web3.
            <br className="hidden sm:block" />
            <span className="sm:hidden"> </span>Deposit at least 50 USDC to get started with Vincent
            Yield:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-4 md:space-y-8 pt-2 ultra-compact-gap">
          <div>
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400"></div>
              <h4 className={`text-xs sm:text-sm ${theme.textMuted} font-medium`}>
                Your Vincent Wallet Address
              </h4>
            </div>

            {/* QR Code centered above address */}
            <div className="flex justify-center mb-3 sm:mb-4">
              <div className="p-1.5 sm:p-2 bg-orange-50/60 dark:bg-orange-900/25">
                <div className="w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center relative">
                  <QRCode
                    value={agentPkpAddress}
                    size={80}
                    style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
                    viewBox={`0 0 80 80`}
                    level="H"
                    className="sm:hidden"
                  />
                  <QRCode
                    value={agentPkpAddress}
                    size={96}
                    style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
                    viewBox={`0 0 96 96`}
                    level="H"
                    className="hidden sm:block"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white rounded-full p-0.5 sm:p-1 w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center shadow-sm">
                      <img
                        src="/orange-v-logo.svg"
                        alt="Vincent V"
                        className="w-3 h-3 sm:w-4 sm:h-4 object-contain"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Agent Address below QR code */}
            <div className="flex justify-center px-2">
              <div className="flex items-center gap-2 sm:gap-3 px-1.5 sm:px-2 py-1 bg-orange-50/60 dark:bg-orange-900/25 max-w-full">
                <code
                  className={`flex-1 text-xs font-mono font-normal ${theme.text} tracking-wide text-center overflow-hidden text-ellipsis`}
                  style={{ fontSize: 'clamp(0.6rem, 2.5vw, 0.75rem)' }}
                >
                  {agentPkpAddress}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyAddress}
                  className={`flex items-center gap-1 shrink-0 bg-orange-50/60 hover:bg-orange-100/60 ${theme.text} border border-orange-200/60 hover:border-orange-300/80 transition-all duration-200 font-normal px-1.5 sm:px-2 py-1`}
                  style={{ borderRadius: '0px', fontSize: 'clamp(0.6rem, 2.5vw, 0.75rem)' }}
                >
                  <Copy className="h-2 w-2 sm:h-2.5 sm:w-2.5" />
                  <span className="hidden xs:inline">{copied ? 'Copied' : 'Copy Address'}</span>
                  <span className="xs:hidden">{copied ? 'OK' : 'Copy'}</span>
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
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

        <div className="flex justify-center pt-3 sm:pt-4 md:pt-8 border-t border-gray-200 dark:border-gray-700">
          <Button
            onClick={handleGetStarted}
            disabled={!balanceFormatted || parseFloat(balanceFormatted) < MINIMUM_DEPOSIT}
            className={`px-6 sm:px-12 py-2 sm:py-3 font-normal tracking-wide transition-all duration-200 border text-white text-sm sm:text-base ${
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
