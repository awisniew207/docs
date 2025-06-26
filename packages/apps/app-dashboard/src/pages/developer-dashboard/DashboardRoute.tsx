import { useDeveloperData } from '@/contexts/DeveloperDataContext';
import DashboardPage from './DashboardPage';

export default function DashboardRoute() {
  const { userApps: apps, userTools: tools, userPolicies: policies } = useDeveloperData();

  // Pass only clean data as props - loading/error states handled by DeveloperDataProvider
  return <DashboardPage apps={apps} tools={tools} policies={policies} error={null} />;
}
