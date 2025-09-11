import { SessionSigs, IRelayPKP } from '@lit-protocol/types';
import WalletConnectPage from '@/components/user-dashboard/withdraw/WalletConnect/WalletConnect';
import { theme } from '@/components/user-dashboard/connect/ui/theme';

export interface WithdrawFormProps {
  sessionSigs: SessionSigs;
  agentPKP: IRelayPKP;
}

export const WithdrawForm: React.FC<WithdrawFormProps> = ({ sessionSigs, agentPKP }) => {
  return (
    <div
      className={`max-w-[550px] w-full mx-auto ${theme.cardBg} rounded-xl shadow-lg border ${theme.cardBorder} overflow-hidden`}
    >
      <div className={`px-6 pt-8 pb-6 border-b ${theme.cardBorder}`}>
        <h3 className={`text-xl font-semibold ${theme.text} mb-6`}>Wallet</h3>

        <div className="mb-4">
          <div className={`text-sm font-medium ${theme.text} mb-2`}>Wallet Information</div>
          <div className={`text-sm font-medium ${theme.text}`}>
            EVM Address: {agentPKP.ethAddress}
          </div>
        </div>
      </div>

      <div className="px-6 pb-6 pt-6">
        <WalletConnectPage agentPKP={agentPKP} sessionSigs={sessionSigs} />
      </div>
    </div>
  );
};
