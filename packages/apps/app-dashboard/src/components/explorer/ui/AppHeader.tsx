import { App, AppVersion, AppVersionAbility } from '@/types/developer-dashboard/appTypes';
import { Activity, Code, Database, ExternalLink } from 'lucide-react';
import { Logo } from '@/components/shared/ui/Logo';
import { useNavigate } from 'react-router';

export function AppHeader({
  app,
  versions,
  versionAbilities,
}: {
  app: App;
  versions: AppVersion[];
  versionAbilities: AppVersionAbility[];
}) {
  const navigate = useNavigate();

  return (
    <div className="relative group">
      <div className="absolute inset-0 bg-black/5 rounded-2xl blur-xl opacity-0 transition-all duration-700"></div>
      <div className="relative bg-white/40 backdrop-blur-xl border border-black/10 rounded-2xl p-8 hover:border-black/20 transition-all duration-500">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
          {/* Logo with subtle glow */}
          <div className="relative group/logo">
            <div className="absolute inset-0 bg-black/5 rounded-xl blur-2xl opacity-0 group-hover/logo:opacity-100 transition-opacity duration-500"></div>
            <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-black/5 border border-black/5 flex items-center justify-center backdrop-blur-sm">
              <Logo
                logo={app.logo}
                alt={`${app.name} logo`}
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* App Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-3">
              <h1 className="text-3xl sm:text-4xl font-light text-black tracking-tight transition-colors duration-500">
                {app.name}
              </h1>
              <span className="px-4 py-1.5 rounded-full text-xs font-medium text-black/90 border border-orange-500 !bg-orange-50 !text-orange-700 backdrop-blur-sm transition-all duration-300">
                {app.deploymentStatus?.toUpperCase()}
              </span>
            </div>
            <p className="text-gray-600 text-base leading-relaxed transition-colors duration-500">
              {app.description}
            </p>

            {/* Quick Stats */}
            <div className="flex items-center gap-8 mt-6">
              <div className="flex items-center gap-2 group/stat">
                <Activity className="w-4 h-4 text-black/40 group-hover/stat:text-black/60 transition-colors duration-300" />
                <span className="text-sm text-gray-500 group-hover/stat:text-gray-600 transition-colors duration-300">
                  {app.deploymentStatus?.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-2 group/stat">
                <Code className="w-4 h-4 text-black/40 group-hover/stat:text-black/60 transition-colors duration-300" />
                <span className="text-sm text-gray-500 group-hover/stat:text-gray-600 transition-colors duration-300">
                  {versions.length} Versions
                </span>
              </div>
              <div className="flex items-center gap-2 group/stat">
                <Database className="w-4 h-4 text-black/40 group-hover/stat:text-black/60 transition-colors duration-300" />
                <span className="text-sm text-gray-500 group-hover/stat:text-gray-600 transition-colors duration-300">
                  {versionAbilities.length} Abilities
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {app.redirectUris && app.redirectUris.length > 0 && (
            <button
              onClick={() =>
                navigate(
                  `/user/appId/${app.appId}/connect?redirectUri=${encodeURIComponent(app.redirectUris![0])}`,
                )
              }
              className="group px-6 py-3 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-medium flex items-center gap-2 hover:scale-105 transition-all duration-300"
            >
              Launch App
              <ExternalLink className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
