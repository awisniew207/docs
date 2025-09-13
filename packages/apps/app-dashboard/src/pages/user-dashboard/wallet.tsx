import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router';
import { useState } from 'react';
import { WithdrawForm } from '@/components/user-dashboard/withdraw/WithdrawForm';
import { WithdrawFormSkeleton } from '@/components/user-dashboard/withdraw/WithdrawFormSkeleton';
import { WalletModal } from '@/components/user-dashboard/wallet/WalletModal';
import useReadAuthInfo from '@/hooks/user-dashboard/useAuthInfo';
import { useAuthGuard } from '@/hooks/user-dashboard/connect/useAuthGuard';
import { useAgentPkpForApp } from '@/hooks/user-dashboard/useAgentPkpForApp';

export function Wallet() {
  const { appId } = useParams();
  const { authInfo, sessionSigs } = useReadAuthInfo();
  const authGuardElement = useAuthGuard();
  const [showModal, setShowModal] = useState(true);

  const { agentPKP, loading: agentPKPLoading } = useAgentPkpForApp(
    authInfo?.userPKP?.ethAddress,
    appId ? Number(appId) : undefined,
  );

  const handleReopenModal = () => {
    setShowModal(true);
  };

  if (authGuardElement || !authInfo?.userPKP || !sessionSigs || agentPKPLoading || !agentPKP) {
    return (
      <>
        <Helmet>
          <title>Vincent | Wallet</title>
          <meta name="description" content="Vincent Wallet Dashboard" />
        </Helmet>
        <div className="w-full h-full flex items-center justify-center">
          <WithdrawFormSkeleton />
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Vincent | Wallet</title>
        <meta name="description" content="Your Vincent wallet dashboard" />
      </Helmet>
      <div className="w-full h-full flex items-center justify-center">
        <WithdrawForm
          sessionSigs={sessionSigs}
          agentPKP={agentPKP}
          onHelpClick={handleReopenModal}
          showHelpButton={!showModal}
        />
      </div>
      <WalletModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}

export default Wallet;
