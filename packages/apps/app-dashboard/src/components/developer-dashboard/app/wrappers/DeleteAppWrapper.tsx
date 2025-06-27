import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DeleteAppForm } from '../forms/DeleteAppForm';
import { useVincentApiWithSIWE } from '@/hooks/developer-dashboard/useVincentApiWithSIWE';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { getErrorMessage } from '@/utils/developer-dashboard/app-forms';
import { App } from '@/contexts/DeveloperDataContext';

interface DeleteAppWrapperProps {
  app: App;
  refetchApps: () => void;
}

export function DeleteAppWrapper({ app, refetchApps }: DeleteAppWrapperProps) {
  const vincentApi = useVincentApiWithSIWE();
  const [deleteApp, { isLoading, isSuccess, isError, data, error }] =
    vincentApi.useDeleteAppMutation();
  const navigate = useNavigate();

  useEffect(() => {
    if (isSuccess && data) {
      refetchApps();

      navigate('/developer/apps'); // Navigate immediately, no delay needed
    }
  }, [isSuccess, data, refetchApps, navigate]);

  // Show spinner while deleting or after success while refetching/navigating
  if (isLoading) {
    return <StatusMessage message="Deleting app..." type="info" />;
  }

  if (isSuccess && data) {
    return <StatusMessage message="App deleted successfully!" type="success" />;
  }

  // Error state
  if (isError && error) {
    const errorMessage = getErrorMessage(error, 'Failed to delete app');
    return <StatusMessage message={errorMessage} type="error" />;
  }

  const handleSubmit = async () => {
    await deleteApp({ appId: app.appId });
  };
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">Delete App</h1>
          <p className="text-gray-600 mt-2">
            Permanently delete "{app.name}" and all its data. This action cannot be undone.
          </p>
        </div>
      </div>

      <DeleteAppForm appName={app.name} onSubmit={handleSubmit} isSubmitting={isLoading} />
    </div>
  );
}
