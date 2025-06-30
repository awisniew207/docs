import { PolicyVersion, Policy } from '@/types/developer-dashboard/appTypes';
import { Badge } from '@/components/ui/badge';
import { Calendar, GitCommit, User, Globe, Package } from 'lucide-react';

interface PolicyVersionsListViewProps {
  policy: Policy;
  versions: PolicyVersion[];
  onVersionClick?: (version: string) => void;
}

export function PolicyVersionsListView({
  policy,
  versions,
  onVersionClick,
}: PolicyVersionsListViewProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const sortedVersions = [...versions].sort((a, b) =>
    b.version.localeCompare(a.version, undefined, { numeric: true }),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">Policy Versions</h1>
          <p className="text-gray-600 mt-2">
            All versions for <span className="font-mono">{policy.packageName}</span>
          </p>
          <div className="flex items-center gap-2 mt-3">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              <Package className="h-3 w-3 mr-1" />
              Active: {policy.activeVersion}
            </Badge>
            <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
              {versions.length} version{versions.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {sortedVersions.map((version) => (
          <div
            key={version.version}
            className={`bg-white shadow rounded-lg border ${
              version.version === policy.activeVersion
                ? 'border-blue-200 ring-1 ring-blue-100'
                : 'border-gray-200 hover:border-gray-300'
            } transition-colors ${onVersionClick ? 'cursor-pointer hover:shadow-md' : ''}`}
            onClick={onVersionClick ? () => onVersionClick(version.version) : undefined}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <GitCommit className="h-5 w-5 text-gray-500" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      Version {version.version}
                    </h3>
                  </div>
                  {version.version === policy.activeVersion && (
                    <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  {formatDate(version.createdAt)}
                </div>
              </div>

              <div className="space-y-4">
                {version.changes && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Changes</h4>
                    <p className="text-sm text-gray-600">{version.changes}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {version.author && (
                    <div className="flex items-start gap-2">
                      <User className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <dt className="text-xs font-medium text-gray-500">Author</dt>
                        <dd className="text-sm text-gray-900">{version.author.name}</dd>
                        {version.author.email && (
                          <dd className="text-xs text-gray-500">{version.author.email}</dd>
                        )}
                      </div>
                    </div>
                  )}

                  {version.homepage && (
                    <div className="flex items-start gap-2">
                      <Globe className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <dt className="text-xs font-medium text-gray-500">Homepage</dt>
                        <dd className="text-sm">
                          <a
                            href={version.homepage}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 truncate block"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {version.homepage.replace(/^https?:\/\//, '')}
                          </a>
                        </dd>
                      </div>
                    </div>
                  )}
                </div>

                {version.keywords && version.keywords.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 mb-2">Keywords</h4>
                    <div className="flex flex-wrap gap-1">
                      {version.keywords.map((keyword) => (
                        <Badge
                          key={keyword}
                          variant="secondary"
                          className="text-xs bg-gray-100 text-gray-700"
                        >
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {versions.length === 0 && (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <GitCommit className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No versions found</h3>
          <p className="text-gray-600">
            This policy doesn't have any versions yet. Create the first version to get started.
          </p>
        </div>
      )}
    </div>
  );
}
