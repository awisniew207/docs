import { Calendar, Search, Tag } from 'lucide-react';
import { App } from '@/types/developer-dashboard/appTypes';
import { useNavigate } from 'react-router-dom';
import { Logo } from '@/components/shared/ui/Logo';

export function AppsDisplay({ apps }: { apps: App[] }) {
  const navigate = useNavigate();

  const getDisplayStatus = (status: string | undefined): string => {
    const normalizedStatus = status?.toLowerCase() || 'prod';
    switch (normalizedStatus) {
      case 'test':
        return 'BETA';
      case 'prod':
        return 'LIVE';
      default:
        return normalizedStatus.toUpperCase();
    }
  };

  return (
    <div className="relative group">
      <div className="absolute inset-0 bg-black/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
      <div className="relative bg-white/40 backdrop-blur-xl border border-black/10 rounded-2xl p-6 hover:border-black/20 transition-all duration-500">
        {/* Table View */}
        <div className="space-y-4">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-4 py-3 text-sm font-medium text-gray-500">
            <div className="col-span-6 sm:col-span-5">Application</div>
            <div className="col-span-3 sm:col-span-2">Status</div>
            <div className="col-span-3 sm:col-span-2">Version</div>
            <div className="hidden sm:block sm:col-span-3">Updated</div>
          </div>

          {/* Table Rows */}
          <div className="space-y-2">
            {apps.map((app) => (
              <div
                key={app.appId}
                className="group/row grid grid-cols-12 gap-4 px-4 py-4 rounded-xl bg-black/[0.02] border border-black/5 hover:border-black/10 cursor-pointer transition-all duration-300"
                onClick={() => navigate(`/explorer/appId/${app.appId}`)}
              >
                {/* Application Info */}
                <div className="col-span-6 sm:col-span-5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-black/5 border border-black/5 flex items-center justify-center flex-shrink-0">
                    <Logo
                      logo={app.logo}
                      alt={`${app.name} logo`}
                      className="w-full h-full object-fill"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-black truncate">{app.name}</p>
                    <p className="text-sm text-gray-500 truncate">
                      {app.description || 'No description'}
                    </p>
                  </div>
                </div>

                {/* Status */}
                <div className="col-span-3 sm:col-span-2 flex items-center">
                  <span className="px-3 py-1 rounded-full text-xs font-medium border border-orange-500 !bg-orange-50 !text-orange-700">
                    {getDisplayStatus(app.deploymentStatus)}
                  </span>
                </div>

                {/* Version */}
                <div className="col-span-3 sm:col-span-2 flex items-center">
                  <div className="flex items-center gap-1">
                    <Tag className="w-3 h-3 text-black/40" />
                    <span className="text-sm text-black">v{app.activeVersion}</span>
                  </div>
                </div>

                {/* Updated */}
                <div className="hidden sm:flex sm:col-span-3 items-center">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-black/40" />
                    <span className="text-sm text-gray-600">
                      {new Date(app.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {apps.length === 0 && (
          <div className="p-12 rounded-xl bg-black/[0.02] border border-black/5 text-center">
            <Search className="w-12 h-12 text-black/20 mx-auto mb-4" />
            <p className="text-gray-500 text-base mb-2">No applications found</p>
            <p className="text-gray-500 text-sm">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}
