import { useNavigate } from 'react-router-dom';
import { DeleteAppForm } from '../forms/DeleteAppForm';
import { useVincentApiWithSIWE } from '@/hooks/developer-dashboard/useVincentApiWithSIWE';
import { useState } from 'react';

interface DeleteAppWrapperProps {
  app: any;
  refetchApps: () => void;
}

export function DeleteAppWrapper({ app, refetchApps }: DeleteAppWrapperProps) {
  const navigate = useNavigate();
  const vincentApiWithSIWE = useVincentApiWithSIWE();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deleteApp] = vincentApiWithSIWE.useDeleteAppMutation();

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await deleteApp({ appId: app.appId });
      await refetchApps(); // Refresh the apps list
      navigate('/developer/apps'); // Navigate immediately, no delay needed
    } catch (error) {
      console.error('Error deleting app:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
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

      <DeleteAppForm appName={app.name} onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </div>
  );
}
