import { SessionSigs, IRelayPKP } from '@lit-protocol/types';
import WalletConnectPage from '@/components/user-dashboard/withdraw/WalletConnect/WalletConnect';
import { theme } from '@/components/user-dashboard/connect/ui/theme';
import { Button } from '@/components/shared/ui/button';
import { useState } from 'react';
import { HelpCircle } from 'lucide-react';

export interface WithdrawFormProps {
  sessionSigs: SessionSigs;
  agentPKP: IRelayPKP;
  onHelpClick?: () => void;
  showHelpButton?: boolean;
}

export const WithdrawForm: React.FC<WithdrawFormProps> = ({
  sessionSigs,
  agentPKP,
  onHelpClick,
  showHelpButton = false,
}) => {
  const [copied, setCopied] = useState(false);

  return (
    <div className="max-w-xl w-full mx-auto">
      <div
        className={`${theme.mainCard} rounded-2xl shadow-sm border ${theme.mainCardBorder} overflow-hidden`}
      >
        <div className={`px-6 py-4 border-b ${theme.cardBorder}`}>
          <div className="flex items-center justify-center relative">
            <h2 className={`text-lg font-medium ${theme.text}`}>Vincent Wallet</h2>
            {showHelpButton && onHelpClick && (
              <button
                onClick={onHelpClick}
                className={`absolute right-0 p-1.5 rounded-md hover:${theme.itemHoverBg} transition-colors`}
                title="Connection Help"
              >
                <HelpCircle className="w-5 h-5 text-orange-500" />
              </button>
            )}
          </div>
        </div>

        <div className="px-6 py-6 space-y-6">
          {/* Wallet Address Section */}
          <div>
            <div className={`text-xs font-medium ${theme.textMuted} mb-2 uppercase tracking-wider`}>
              Vincent Wallet Address
            </div>
            <div className="flex items-center gap-2">
              <div className={`font-mono text-sm ${theme.text} break-all flex-1`}>
                {agentPKP.ethAddress}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(agentPKP.ethAddress);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className={`px-2 py-1 ${theme.text} border ${theme.cardBorder} hover:${theme.itemHoverBg}`}
              >
                {copied ? 'Copied ✓' : 'Copy'}
              </Button>
            </div>
          </div>

          {/* WalletConnect Section */}
          <div>
            <div className={`text-sm font-medium ${theme.text} mb-3`}>Wallet Status</div>
            <WalletConnectPage agentPKP={agentPKP} sessionSigs={sessionSigs} />
          </div>
        </div>
      </div>
    </div>
  );
};
