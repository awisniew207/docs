import { TabsContent } from '@/components/shared/ui/tabs';
import { App, AppVersion } from '@/types/developer-dashboard/appTypes';
import { FileText } from 'lucide-react';
import { Tag } from 'lucide-react';

interface AllAppVersionsProps {
  versions: AppVersion[];
  app: App;
}

export function AllAppVersions({ versions, app }: AllAppVersionsProps) {
  return (
    <TabsContent value="all" className="mt-0">
      {/* All Versions View */}
      <div className="space-y-3">
        {versions.map((version) => (
          <div
            key={version.version}
            className="group/version p-5 rounded-xl bg-black/[0.02] hover:bg-black/[0.04] border border-black/5 hover:border-black/10 transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <Tag className="w-4 h-4 text-black/40" />
                  <span className="text-lg font-light text-black/90">v{version.version}</span>
                </div>
                {version.version === app.activeVersion && (
                  <span className="px-3 py-1 bg-orange-100 text-orange-600 border-orange-200 text-xs rounded-full border font-semibold">
                    ACTIVE
                  </span>
                )}
              </div>
            </div>

            {version.changes && (
              <div className="mt-4 p-4 rounded-lg bg-black/[0.02] border border-black/5">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-3 h-3 text-black/40" />
                  <span className="text-xs font-medium text-gray-500">Changes</span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{version.changes}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </TabsContent>
  );
}
