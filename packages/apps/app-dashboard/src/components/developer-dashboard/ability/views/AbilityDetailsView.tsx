import { Ability, AbilityVersion } from '@/types/developer-dashboard/appTypes';
import { Badge } from '@/components/shared/ui/badge';
import { Logo } from '@/components/shared/ui/Logo';
import { Edit, Plus, ArrowLeftRight, Trash2 } from 'lucide-react';

interface AbilityOverviewProps {
  ability: Ability;
  activeVersionData: AbilityVersion;
  onOpenMutation: (mutationType: string) => void;
}

export default function AbilityOverview({
  ability,
  activeVersionData,
  onOpenMutation,
}: AbilityOverviewProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-neutral-800 dark:text-white">
            {ability.packageName}
          </h1>
          <p className="text-gray-600 dark:text-white/60 mt-2">{activeVersionData.description}</p>
          {activeVersionData?.keywords && activeVersionData.keywords.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {activeVersionData.keywords.map((keyword: string) => (
                <Badge key={keyword} variant="secondary">
                  {keyword}
                </Badge>
              ))}
            </div>
          )}
        </div>
        <div className="ml-6 flex-shrink-0">
          {ability.logo && ability.logo.length >= 10 ? (
            <Logo
              logo={ability.logo}
              alt="Ability logo"
              className="max-w-24 max-h-24 object-contain rounded-lg border dark:border-white/10 shadow-sm bg-gray-50 dark:bg-white/5"
            />
          ) : (
            <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-lg border dark:border-white/10 flex items-center justify-center">
              <img src="/logo.svg" alt="Vincent logo" className="w-8 h-8 opacity-50" />
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-800 shadow rounded-lg">
        <div className="p-6">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => onOpenMutation('edit-ability')}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg text-sm font-medium text-gray-700 dark:text-white/80 bg-white dark:bg-neutral-800 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              <Edit className="h-4 w-4" />
              Edit Ability
            </button>
            <button
              onClick={() => onOpenMutation('create-ability-version')}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg text-sm font-medium text-gray-700 dark:text-white/80 bg-white dark:bg-neutral-800 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create Ability Version
            </button>
            <button
              onClick={() => onOpenMutation('change-ability-owner')}
              className="inline-flex items-center gap-2 px-4 py-2 border border-orange-200 dark:border-orange-500/30 rounded-lg text-sm font-medium text-orange-600 dark:text-orange-400 bg-white dark:bg-neutral-800 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors"
            >
              <ArrowLeftRight className="h-4 w-4" />
              Change Owner
            </button>
            <button
              onClick={() => onOpenMutation('delete-ability')}
              className="inline-flex items-center gap-2 px-4 py-2 border border-red-200 dark:border-red-500/30 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 bg-white dark:bg-neutral-800 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Delete Ability
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-800 shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-neutral-800 dark:text-white mb-4">
          Ability Details
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-white/40">Package Name</dt>
            <dd className="mt-1 text-sm text-neutral-800 dark:text-white font-mono">
              {ability.packageName}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-white/40">Active Version</dt>
            <dd className="mt-1 text-sm text-neutral-800 dark:text-white">
              {ability.activeVersion || 'N/A'}
            </dd>
          </div>
          {activeVersionData.ipfsCid && (
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-white/40">IPFS CID</dt>
              <dd className="mt-1 text-xs text-neutral-800 dark:text-white font-mono break-all">
                {activeVersionData.ipfsCid}
              </dd>
            </div>
          )}
          {ability.deploymentStatus && (
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-white/40">
                Deployment Status
              </dt>
              <dd className="mt-1 text-sm text-neutral-800 dark:text-white">
                {ability.deploymentStatus}
              </dd>
            </div>
          )}
        </div>
      </div>

      {activeVersionData?.changes && (
        <div className="bg-white dark:bg-neutral-800 shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-neutral-800 dark:text-white mb-4">
            Version Changes
          </h2>
          <p className="text-sm text-gray-700 dark:text-white/60">{activeVersionData.changes}</p>
        </div>
      )}

      {activeVersionData?.supportedPolicies &&
        Object.keys(activeVersionData.supportedPolicies).length > 0 && (
          <div className="bg-white dark:bg-neutral-800 shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-neutral-800 dark:text-white mb-4">
              Supported Policies
            </h2>
            <div className="space-y-2">
              {Object.entries(activeVersionData.supportedPolicies).map(([key, value]) => (
                <div
                  key={key}
                  className="text-sm text-neutral-800 dark:text-white font-mono bg-gray-50 dark:bg-white/5 px-3 py-2 rounded"
                >
                  {key}: {value}
                </div>
              ))}
            </div>
          </div>
        )}

      {activeVersionData?.dependencies && activeVersionData.dependencies.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-neutral-800 mb-4">Dependencies</h2>
          <div className="space-y-2">
            {activeVersionData.dependencies.map((dep: string) => (
              <div
                key={dep}
                className="text-sm text-neutral-800 dark:text-white font-mono bg-gray-50 px-3 py-2 rounded"
              >
                {dep}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeVersionData?.contributors && activeVersionData.contributors.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-neutral-800 mb-4">Contributors</h2>
          <div className="space-y-3">
            {activeVersionData.contributors.map((contributor: any, index: number) => (
              <div key={index} className="border-l-4 border-gray-200 dark:border-white/20 pl-4">
                <div className="font-medium text-neutral-800">{contributor.name}</div>
                {contributor.email && (
                  <div className="text-sm text-gray-600">{contributor.email}</div>
                )}
                {contributor.url && (
                  <div className="text-sm">
                    <a
                      href={contributor.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-700 dark:text-white/70 hover:text-gray-800 dark:hover:text-white/80"
                    >
                      {contributor.url}
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
