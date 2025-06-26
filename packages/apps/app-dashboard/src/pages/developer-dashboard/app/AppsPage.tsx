import { useNavigate } from 'react-router';
import { AppsList } from '@/components/developer-dashboard/ui/ResourceLists';
import { useAppFilters } from '@/hooks/developer-dashboard/app/useAppFilters';

export default function AppsPage() {
  const navigate = useNavigate();
  const { sortOption, setSortOption, filteredApps, loading, error } = useAppFilters();

  return (
    <AppsList
      apps={filteredApps}
      isLoading={loading}
      error={error}
      sortOption={sortOption}
      onSortChange={setSortOption}
      onCreateClick={() => navigate('/developer/create-app')}
      onAppClick={(app: any) => navigate(`/developer/appId/${app.appId}`)}
    />
  );
}
