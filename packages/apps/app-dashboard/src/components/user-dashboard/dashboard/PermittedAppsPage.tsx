import { App } from '@/types/developer-dashboard/appTypes';
import { theme } from '@/components/user-dashboard/connect/ui/theme';
import { Package } from 'lucide-react';
import { AgentAppPermission } from '@/utils/user-dashboard/getAgentPkps';
import { PermittedAppCard } from './ui/PermittedAppCard';

type FilterState = 'permitted' | 'unpermitted' | 'all';

type PermittedAppsPageProps = {
  apps: App[];
  permittedPkps: AgentAppPermission[];
  unpermittedPkps: AgentAppPermission[];
  filterState: FilterState;
  setFilterState: (state: FilterState) => void;
};

export function PermittedAppsPage({
  apps,
  permittedPkps,
  unpermittedPkps,
  filterState,
  setFilterState,
}: PermittedAppsPageProps) {
  const getEmptyStateMessage = () => {
    switch (filterState) {
      case 'permitted':
        return {
          title: 'No permitted applications',
          description: "You haven't granted permissions to any applications yet. Once you authorize apps, they'll appear here."
        };
      case 'unpermitted':
        return {
          title: 'No unpermitted applications',
          description: 'All available applications have been granted permissions.'
        };
      case 'all':
        return {
          title: 'No applications found',
          description: 'There are no applications available at this time.'
        };
      default:
        return {
          title: 'No applications found',
          description: 'There are no applications available at this time.'
        };
    }
  };

  const emptyState = getEmptyStateMessage();

  return (
    <div className="w-full">
      {/* Filter Tabs */}
      <div className="flex items-center gap-2 px-3 sm:px-6 pt-6 pb-4">
        <button
          onClick={() => setFilterState('permitted')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filterState === 'permitted'
              ? 'bg-orange-500 text-white'
              : `${theme.itemBg} ${theme.text} hover:bg-gray-100 dark:hover:bg-white/5`
          }`}
        >
          Permitted
        </button>
        <button
          onClick={() => setFilterState('unpermitted')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filterState === 'unpermitted'
              ? 'bg-orange-500 text-white'
              : `${theme.itemBg} ${theme.text} hover:bg-gray-100 dark:hover:bg-white/5`
          }`}
        >
          Unpermitted
        </button>
        <button
          onClick={() => setFilterState('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filterState === 'all'
              ? 'bg-orange-500 text-white'
              : `${theme.itemBg} ${theme.text} hover:bg-gray-100 dark:hover:bg-white/5`
          }`}
        >
          All
        </button>
      </div>

      {apps.length === 0 ? (
        <div className="flex items-center justify-center min-h-[400px] w-full">
          <div className="text-center max-w-md mx-auto px-6">
            <div
              className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${theme.itemBg} ${theme.cardBorder} border mb-6`}
            >
              <Package className={`w-8 h-8 ${theme.textMuted}`} />
            </div>
            <h3 className={`text-xl font-semibold mb-2 ${theme.text}`}>{emptyState.title}</h3>
            <p className={`text-sm ${theme.textMuted} leading-relaxed`}>{emptyState.description}</p>
          </div>
        </div>
      ) : (
        <div className="w-full flex justify-center md:justify-start px-3 sm:px-6">
          <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 max-w-[1600px] place-items-center md:place-items-start">
            {apps.map((app, index) => {
              const permittedPermission = permittedPkps.find((p) => p.appId === app.appId);
              const unpermittedPermission = unpermittedPkps.find((p) => p.appId === app.appId);
              const permission = permittedPermission || unpermittedPermission;
              const isUnpermitted = !!unpermittedPermission && !permittedPermission;
              return (
                <PermittedAppCard
                  key={app.appId}
                  app={app}
                  permission={permission}
                  isUnpermitted={isUnpermitted}
                  index={index}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
