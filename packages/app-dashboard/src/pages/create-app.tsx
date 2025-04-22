import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAccount } from 'wagmi';

import CreateAppScreen from '@/components/developer/CreateApp';
import { WithHeader } from '@/components/layout/Header';
import { wrap } from '@/utils/components';
import { AppProviders } from '@/providers';

export function CreateApp() {
  const { isConnected } = useAccount();
  const navigate = useNavigate();

  const goToRoot = useCallback(() => {
    navigate('/', { replace: true });
  }, [navigate]);

  const handleSuccess = useCallback(() => {
    setTimeout(() => {
      navigate('/', { replace: true });
    }, 1500);
  }, [navigate]);

  useEffect(() => {
    if (!isConnected) {
      goToRoot();
    }
  }, [isConnected, goToRoot]);

  return (
    <CreateAppScreen onBack={goToRoot} onSuccess={handleSuccess} />
  );
}

const CreateAppPage = wrap(WithHeader(CreateApp), AppProviders);
export default CreateAppPage;
