import { useNavigate } from 'react-router';
import { DashboardContent } from '@/components/developer-dashboard/app/DashboardContent';
import { useDeveloperData } from '@/contexts/DeveloperDataContext';
import Loading from '@/components/layout/Loading';
import { MenuId } from '@/types/developer-dashboard/menuId';

export default function DashboardPage() {
  const navigate = useNavigate();
  const {
    userApps: apps,
    userTools: tools,
    userPolicies: policies,
    isLoading,
    hasErrors,
  } = useDeveloperData();

  const handleMenuSelection = (id: MenuId) => {
    const routes: Record<MenuId, string> = {
      'create-app': '/developer/create-app',
      'create-tool': '/developer/create-tool',
      'create-policy': '/developer/create-policy',
      app: '/developer/apps',
      tool: '/developer/tools',
      policy: '/developer/policies',
    };

    const route = routes[id];
    if (route) {
      navigate(route);
    } else {
      // This should never happen with proper typing
      console.warn('Unknown menu selection:', id);
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <DashboardContent
      filteredAppsCount={apps.length}
      filteredToolsCount={tools.length}
      filteredPoliciesCount={policies.length}
      error={hasErrors ? 'Some data failed to load' : null}
      onMenuSelection={handleMenuSelection}
    />
  );
}
