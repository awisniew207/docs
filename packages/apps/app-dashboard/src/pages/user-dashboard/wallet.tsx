import { Helmet } from 'react-helmet-async';
import WithdrawForm from '@/components/user-dashboard/withdraw/WithdrawForm';
import useReadAuthInfo from '@/hooks/user-dashboard/useAuthInfo';
import { useAuthGuard } from '@/hooks/user-dashboard/consent/useAuthGuard';
import Loading from '@/components/shared/ui/Loading';

export function Wallet() {
  const { authInfo, sessionSigs } = useReadAuthInfo();
  const authGuardElement = useAuthGuard();

  if (authGuardElement || !authInfo?.userPKP || !authInfo?.agentPKP || !sessionSigs) {
    return (
      <>
        <Helmet>
          <title>Vincent | Wallet</title>
          <meta name="description" content="Your Vincent wallet dashboard" />
        </Helmet>
        <Loading />
      </>
    );
  }

  return (
    <>
      <main className="p-8">
        <WithdrawForm
          sessionSigs={sessionSigs}
          agentPKP={authInfo.agentPKP}
          userPKP={authInfo.userPKP}
        />
      </main>
    </>
  );
}

export default Wallet;
