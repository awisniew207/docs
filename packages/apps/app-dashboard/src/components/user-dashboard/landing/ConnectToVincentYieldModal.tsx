import { useState } from 'react';
import { IRelayPKP } from '@lit-protocol/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/shared/ui/dialog';
import { Button } from '@/components/shared/ui/button';
import { theme } from '../connect/ui/theme';
import { AlertCircle, ArrowRight } from 'lucide-react';

interface ConnectToVincentYieldModalProps {
  agentPKP: IRelayPKP;
}

export function ConnectToVincentYieldModal({ agentPKP }: ConnectToVincentYieldModalProps) {
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleConnect = () => {
    setIsRedirecting(true);
    const redirectUri = encodeURIComponent('https://yield.heyvincent.ai');
    const connectUrl = `${window.location.origin}/user/appId/2353287477/connect?redirectUri=${redirectUri}`;
    window.location.href = connectUrl;
  };

  return (
    <Dialog open={true} onOpenChange={undefined}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        button[class*="absolute top-4 right-4"] {
          opacity: 0.15 !important;
        }
        button[class*="absolute top-4 right-4"]:hover {
          opacity: 0.4 !important;
        }
      `}</style>
      <DialogContent
        className={`w-[calc(100%-1rem)] max-w-md mx-auto ${theme.mainCard} border ${theme.mainCardBorder} rounded-2xl shadow-2xl overflow-hidden p-0 [&>button]:hidden`}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className={`px-3 sm:px-6 pt-4 pb-3 border-b ${theme.cardBorder}`}>
          <div className="flex items-center justify-center mb-3">
            <div
              className={`inline-flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30`}
            >
              <AlertCircle className="w-6 h-6 text-orange-500" />
            </div>
          </div>
          <DialogTitle className={`text-lg font-semibold ${theme.text} text-center`}>
            Architectural Update Required
          </DialogTitle>
          <DialogDescription className={`${theme.textMuted} text-sm text-center mt-2`}>
            There's been an architectural change to Vincent Wallets. Your existing wallet needs to
            be connected to Vincent Yield to continue.
          </DialogDescription>
        </DialogHeader>

        <div className="px-3 sm:px-6 pt-4 pb-4">
          <div className={`rounded-lg border ${theme.cardBorder} ${theme.itemBg} p-4`}>
            <div className="space-y-3">
              <div>
                <div className={`text-xs font-medium ${theme.textMuted} mb-1`}>
                  Your existing Vincent Wallet
                </div>
                <code className={`font-mono text-xs ${theme.text} break-all`}>
                  {agentPKP.ethAddress}
                </code>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-orange-50/50 dark:bg-orange-900/10 rounded-lg border border-orange-200/50 dark:border-orange-800/30">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className={`text-xs ${theme.text}`}>
                  <span className="font-medium">Important:</span> This is a required update due to
                  architectural improvements in the Vincent ecosystem.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex px-3 sm:px-6 pt-3 pb-4 sm:pb-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            onClick={handleConnect}
            disabled={isRedirecting}
            className={`w-full font-normal tracking-wide transition-all duration-200 border text-white flex items-center justify-center gap-2 ${
              isRedirecting
                ? 'bg-gray-100 dark:bg-gray-800 !text-gray-400 border-gray-200 dark:border-gray-700 cursor-not-allowed'
                : ''
            }`}
            style={{
              borderRadius: '0.5rem',
              fontSize: 'clamp(0.75rem, 3vw, 0.875rem)',
              padding: 'clamp(0.5rem, 1vw, 0.75rem) clamp(1rem, 4vw, 1.5rem)',
              ...(isRedirecting
                ? {}
                : {
                    backgroundColor: '#e55a1a',
                    borderColor: '#e55a1a',
                    animation: 'pulse 2s ease-in-out infinite',
                  }),
            }}
          >
            {isRedirecting ? (
              'Redirecting...'
            ) : (
              <>
                Connect to Vincent Yield
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
