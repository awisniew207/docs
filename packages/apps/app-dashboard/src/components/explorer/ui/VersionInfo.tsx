import { AllAppVersions } from './AllAppVersions';
import { Tabs, TabsTrigger, TabsList } from '@/components/shared/ui/tabs';
import { GitBranch } from 'lucide-react';
import { App, AppVersion, AppVersionAbility } from '@/types/developer-dashboard/appTypes';
import { ActiveAppVersion } from './ActiveAppVersion';

interface VersionInfoProps {
  app: App;
  versions: AppVersion[];
  versionAbilities: AppVersionAbility[];
}

export function VersionInfo({ app, versions, versionAbilities }: VersionInfoProps) {
  return (
    versions.length > 0 && (
      <div className="group relative">
        <div className="absolute inset-0 bg-black/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
        <div className="relative bg-white/40 backdrop-blur-xl border border-black/10 rounded-2xl p-6 hover:border-black/20 transition-all duration-500">
          <Tabs defaultValue="active" className="w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 w-full">
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="p-2 rounded-lg bg-black/5 border border-black/5">
                  <GitBranch className="w-5 h-5 text-black/60" />
                </div>
                <h2 className="text-lg font-light text-black transition-colors duration-500">
                  Version Information
                </h2>
              </div>

              <div className="flex-shrink-0">
                <TabsList className="bg-black/5 border border-black/5 rounded-full p-1 bg-transparent h-auto">
                  <TabsTrigger
                    value="active"
                    className="text-gray-500 hover:text-black data-[state=active]:text-black data-[state=active]:bg-white/40 rounded-full px-6 py-2 text-sm font-medium border-0 bg-transparent h-auto transition-all duration-300 focus:outline-none"
                  >
                    Active Version
                  </TabsTrigger>
                  <TabsTrigger
                    value="all"
                    className="text-gray-500 hover:text-black data-[state=active]:text-black data-[state=active]:bg-white/40 rounded-full px-6 py-2 text-sm font-medium border-0 bg-transparent h-auto transition-all duration-300 focus:outline-none"
                  >
                    All Versions
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>

            <ActiveAppVersion versions={versions} versionAbilities={versionAbilities} app={app} />
            <AllAppVersions versions={versions} app={app} />
          </Tabs>
        </div>
      </div>
    )
  );
}
