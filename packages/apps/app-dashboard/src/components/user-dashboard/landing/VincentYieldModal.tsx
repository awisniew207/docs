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
        className={`w-[99vw] max-w-none sm:w-full sm:max-w-2xl sm:max-h-[90vh] lg:!max-w-4xl !rounded-none ${theme.mainCard} border ${theme.mainCardBorder} overflow-y-auto`}
        style={{ padding: 'clamp(0.5rem, 3vw, 1.5rem)' }}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="pb-3 sm:pb-4 md:pb-8 border-b border-gray-200 dark:border-gray-700">
          <DialogTitle
            className={`font-medium tracking-tight ${theme.text} mb-1 sm:mb-2`}
            style={{ fontSize: 'clamp(1rem, 6vw, 3rem)', lineHeight: '1.2' }}
          >
            Welcome to Vincent
          </DialogTitle>
          <div
            className="uppercase tracking-widest font-medium mb-4"
            style={{
              color: '#ff722c',
              fontSize: 'clamp(0.625rem, 3.5vw, 0.875rem)',
              marginBottom: 'clamp(0.5rem, 2vw, 1rem)',
            }}
          >
            EARLY ACCESS
          </div>
          <DialogDescription
            className={`${theme.textMuted} leading-relaxed font-normal text-center px-[2vw] sm:px-0`}
            style={{ fontSize: 'clamp(0.75rem, 4vw, 1.125rem)', lineHeight: '1.3' }}
          >
            Vincent powers the next wave of user-owned finance and agent-driven automation for Web3.
            <br className="hidden sm:block" />
            <span className="sm:hidden"> </span>Deposit at least 50 USDC to get started with Vincent
            Yield:
          </DialogDescription>
        </DialogHeader>

        <div
          className="pt-2"
          style={{ gap: 'clamp(0.5rem, 4vw, 2rem)', display: 'flex', flexDirection: 'column' }}
        >
          <div>
            <div
              className="flex items-center"
              style={{
                gap: 'clamp(0.25rem, 2vw, 0.75rem)',
                marginBottom: 'clamp(0.5rem, 2vw, 1rem)',
              }}
            >
              <div
                className="bg-gray-400"
                style={{
                  width: 'clamp(0.375rem, 1.5vw, 0.5rem)',
                  height: 'clamp(0.375rem, 1.5vw, 0.5rem)',
                }}
              ></div>
              <h4
                className={`${theme.textMuted} font-medium`}
                style={{ fontSize: 'clamp(0.625rem, 3.5vw, 0.875rem)' }}
              >
                Your Vincent Wallet Address
              </h4>
            </div>

            {/* QR Code centered above address */}
            <div
              className="flex justify-center"
              style={{ marginBottom: 'clamp(0.5rem, 2vw, 1rem)' }}
            >
              <div
                className="bg-orange-50/60 dark:bg-orange-900/25"
                style={{ padding: 'clamp(0.375rem, 2vw, 0.5rem)' }}
              >
                <div
                  className="flex items-center justify-center relative"
                  style={{ width: 'clamp(3rem, 18vw, 6rem)', height: 'clamp(3rem, 18vw, 6rem)' }}
                >
                  <QRCode
                    value={agentPkpAddress}
                    size={Math.min(96, Math.max(64, window.innerWidth * 0.2))}
                    style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
                    viewBox={`0 0 96 96`}
                    level="H"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className="bg-white rounded-full flex items-center justify-center shadow-sm"
                      style={{
                        padding: 'clamp(0.125rem, 1vw, 0.25rem)',
                        width: 'clamp(1.25rem, 5vw, 1.5rem)',
                        height: 'clamp(1.25rem, 5vw, 1.5rem)',
                      }}
                    >
                      <img
                        src="/orange-v-logo.svg"
                        alt="Vincent V"
                        className="object-contain"
                        style={{
                          width: 'clamp(0.75rem, 3vw, 1rem)',
                          height: 'clamp(0.75rem, 3vw, 1rem)',
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Agent Address below QR code */}
            <div className="flex justify-center" style={{ padding: '0 2vw' }}>
              <div
                className="flex items-center bg-orange-50/60 dark:bg-orange-900/25 max-w-full py-1"
                style={{
                  gap: 'clamp(0.5rem, 2vw, 0.75rem)',
                  padding: 'clamp(0.375rem, 1.5vw, 0.5rem) clamp(0.5rem, 2vw, 0.75rem)',
                }}
              >
                <code
                  className={`flex-1 font-mono font-normal ${theme.text} text-center overflow-hidden`}
                  style={{
                    fontSize: 'clamp(0.5rem, 3vw, 0.75rem)',
                    letterSpacing: 'clamp(-0.025em, 0vw, 0.025em)',
                    wordBreak: 'break-all',
                  }}
                >
                  {agentPkpAddress}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyAddress}
                  tabIndex={-1}
                  className={`flex items-center shrink-0 bg-orange-50/60 hover:bg-orange-100/60 ${theme.text} border border-orange-200/60 hover:border-orange-300/80 transition-all duration-200 font-normal py-1 focus:outline-none focus:ring-0`}
                  style={{
                    borderRadius: '0px',
                    fontSize: 'clamp(0.5rem, 2.8vw, 0.75rem)',
                    gap: 'clamp(0.125rem, 1vw, 0.25rem)',
                    padding: 'clamp(0.125rem, 1vw, 0.375rem) clamp(0.25rem, 2vw, 0.5rem)',
                  }}
                >
                  <Copy
                    style={{
                      width: 'clamp(0.375rem, 2.5vw, 0.625rem)',
                      height: 'clamp(0.375rem, 2.5vw, 0.625rem)',
                    }}
                  />
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`${theme.textMuted} font-medium`}
                    style={{ fontSize: 'clamp(0.625rem, 3.5vw, 0.875rem)' }}
                  >
                    Balance
                  </div>
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
                      className="text-red-500 hover:text-red-400 font-normal transition-colors"
                      style={{ fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}
                    >
                      Error - Retry
                    </button>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div
                    className="flex justify-between"
                    style={{ fontSize: 'clamp(0.5rem, 3vw, 0.75rem)' }}
                  >
                    <span className={theme.textMuted}>
                      ${balanceFormatted || '0.00'} / $50.00 USDC
                    </span>
                    {currentBalance < MINIMUM_DEPOSIT && (
                      <span
                        style={{ color: '#ff722c', fontSize: 'clamp(0.625rem, 2.5vw, 0.75rem)' }}
                      >
                        ${amountNeeded.toFixed(2)} needed
                      </span>
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
            className={`font-normal tracking-wide transition-all duration-200 border text-white ${
              !balanceFormatted || parseFloat(balanceFormatted) < MINIMUM_DEPOSIT
                ? 'bg-gray-100 dark:bg-gray-800 !text-gray-400 border-gray-200 dark:border-gray-700 cursor-not-allowed'
                : ''
            }`}
            style={{
              borderRadius: '0px',
              fontSize: 'clamp(0.875rem, 3.5vw, 1rem)',
              padding: 'clamp(0.5rem, 1vw, 0.75rem) clamp(1.5rem, 6vw, 3rem)',
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
