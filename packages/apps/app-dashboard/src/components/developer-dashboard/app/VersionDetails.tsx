import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';

interface VersionDetailsProps {
  version: number;
  appId: number;
  appName?: string;
  versionData: any; // The fetched version data
}

export function VersionDetails({ version, appId, versionData }: VersionDetailsProps) {
  // Fetch tools for this specific version
  const {
    data: versionTools,
    isLoading: toolsLoading,
    error: toolsError,
  } = vincentApiClient.useListAppVersionToolsQuery({
    appId,
    version,
  });

  if (!versionData) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Version Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Version {version} not found for this app.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {(versionData as any).changes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900">Version Changes</CardTitle>
            <CardDescription className="text-gray-700">What's new in this version</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-gray-50 rounded-lg border">
              <p className="text-gray-900 text-sm whitespace-pre-wrap">
                {(versionData as any).changes}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">Associated Tools</CardTitle>
          <CardDescription className="text-gray-700">
            Tools included in this version
          </CardDescription>
        </CardHeader>
        <CardContent>
          {toolsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mr-2"></div>
              <span className="text-gray-600">Loading tools...</span>
            </div>
          ) : toolsError ? (
            <div className="text-center py-8">
              <div className="text-red-400 text-lg mb-2">⚠️</div>
              <p className="text-red-600">Error loading tools</p>
            </div>
          ) : versionTools && versionTools.length > 0 ? (
            <div className="space-y-3">
              {versionTools.map((tool: any, index: number) => (
                <div
                  key={tool.toolPackageName || index}
                  className="p-4 bg-gray-50 rounded-lg border"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{tool.toolPackageName}</div>
                      <div className="text-sm text-gray-600 mt-1">Version: {tool.toolVersion}</div>
                      {tool.hiddenSupportedPolicies && tool.hiddenSupportedPolicies.length > 0 && (
                        <div className="text-sm text-gray-500 mt-1">
                          Hidden policies: {tool.hiddenSupportedPolicies.join(', ')}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-400">
                      Added: {new Date(tool.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 text-lg mb-2">📦</div>
              <p className="text-gray-600">No tools associated with this version</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
