import { Tool, ToolVersion } from '@/types/developer-dashboard/appTypes';
import { Badge } from '@/components/ui/badge';

interface ToolOverviewProps {
  tool: Tool;
  activeVersionData: ToolVersion;
  onOpenMutation: (mutationType: string) => void;
}

export default function ToolOverview({
  tool,
  activeVersionData,
  onOpenMutation,
}: ToolOverviewProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{tool.packageName}</h1>
          <p className="text-gray-600 mt-2">{activeVersionData.description}</p>
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
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="p-6">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => onOpenMutation('edit-tool')}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Edit Tool
            </button>
            <button
              onClick={() => onOpenMutation('create-tool-version')}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Create Tool Version
            </button>
            <button
              onClick={() => onOpenMutation('change-tool-owner')}
              className="inline-flex items-center gap-2 px-4 py-2 border border-orange-200 rounded-lg text-sm font-medium text-orange-600 bg-white hover:bg-orange-50 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                />
              </svg>
              Change Owner
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Tool Details</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">Package Name</dt>
            <dd className="mt-1 text-sm text-gray-900 font-mono">{tool.packageName}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Active Version</dt>
            <dd className="mt-1 text-sm text-gray-900">{tool.activeVersion || 'N/A'}</dd>
          </div>
          {activeVersionData.author && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Author</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {activeVersionData.author.name}
                {activeVersionData.author.email && (
                  <div className="text-xs text-gray-500">{activeVersionData.author.email}</div>
                )}
                {activeVersionData.author.url && (
                  <div className="text-xs">
                    <a
                      href={activeVersionData.author.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {activeVersionData.author.url}
                    </a>
                  </div>
                )}
              </dd>
            </div>
          )}
          {activeVersionData?.homepage && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Homepage</dt>
              <dd className="mt-1 text-sm">
                <a
                  href={activeVersionData.homepage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                >
                  {activeVersionData.homepage}
                </a>
              </dd>
            </div>
          )}
          {activeVersionData?.repository && activeVersionData.repository.length > 0 && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Repository</dt>
              <dd className="mt-1 text-sm">
                {activeVersionData.repository.map((repo: string, index: number) => (
                  <div key={index}>
                    <a
                      href={repo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {repo}
                    </a>
                  </div>
                ))}
              </dd>
            </div>
          )}
          {activeVersionData.ipfsCid && (
            <div>
              <dt className="text-sm font-medium text-gray-500">IPFS CID</dt>
              <dd className="mt-1 text-xs text-gray-900 font-mono break-all">
                {activeVersionData.ipfsCid}
              </dd>
            </div>
          )}
        </div>
      </div>

      {activeVersionData?.changes && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Version Changes</h2>
          <p className="text-sm text-gray-700">{activeVersionData.changes}</p>
        </div>
      )}

      {activeVersionData?.supportedPolicies && activeVersionData.supportedPolicies.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Supported Policies</h2>
          <div className="space-y-2">
            {activeVersionData.supportedPolicies.map((policy: string) => (
              <div
                key={policy}
                className="text-sm text-gray-900 font-mono bg-gray-50 px-3 py-2 rounded"
              >
                {policy}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeVersionData?.dependencies && activeVersionData.dependencies.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Dependencies</h2>
          <div className="space-y-2">
            {activeVersionData.dependencies.map((dep: string) => (
              <div
                key={dep}
                className="text-sm text-gray-900 font-mono bg-gray-50 px-3 py-2 rounded"
              >
                {dep}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeVersionData?.contributors && activeVersionData.contributors.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Contributors</h2>
          <div className="space-y-3">
            {activeVersionData.contributors.map((contributor: any, index: number) => (
              <div key={index} className="border-l-4 border-blue-200 pl-4">
                <div className="font-medium text-gray-900">{contributor.name}</div>
                {contributor.email && (
                  <div className="text-sm text-gray-600">{contributor.email}</div>
                )}
                {contributor.url && (
                  <div className="text-sm">
                    <a
                      href={contributor.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
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
