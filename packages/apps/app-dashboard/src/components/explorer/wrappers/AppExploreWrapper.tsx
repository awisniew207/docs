import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { AppExploreView } from '../views/AppExploreView';
import { ExplorerAppsSkeleton } from '../ui/ExplorerAppsSkeleton';
import { ExplorerErrorPage } from '../ui/ExplorerErrorPage';
import { App } from '@/types/developer-dashboard/appTypes';

export const AppExploreWrapper = () => {
  const { data: apps, isLoading, isError } = vincentApiClient.useListAppsQuery();

  const activeApps = apps?.filter((app: App) => app.deploymentStatus !== 'dev') || [];

  // Loading states
  if (isLoading) return <ExplorerAppsSkeleton />;

  // Error states
  if (isError) {
    return (
      <ExplorerErrorPage
        title="Failed to Load Apps"
        message="We couldn't load the app explorer. This might be due to a network issue or server problem."
      />
    );
  }

  if (!apps) {
    return (
      <ExplorerErrorPage
        title="No Apps Found"
        message="No applications are currently available in the explorer."
      />
    );
  }

  return <AppExploreView apps={activeApps} />;
};
