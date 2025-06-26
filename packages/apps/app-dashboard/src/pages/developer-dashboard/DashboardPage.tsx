import { useNavigate } from 'react-router';
import { DashboardContent } from '@/components/developer-dashboard/DashboardContent';
import { MenuId } from '@/types/developer-dashboard/menuId';

interface DashboardPageProps {
  apps: any[];
  tools: any[];
  policies: any[];
  error: string | null;
}

export default function DashboardPage({ apps, tools, policies, error }: DashboardPageProps) {
  const navigate = useNavigate();

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

  return (
    <DashboardContent
      filteredAppsCount={apps.length}
      filteredToolsCount={tools.length}
      filteredPoliciesCount={policies.length}
      error={error}
      onMenuSelection={handleMenuSelection}
    />
  );
}
