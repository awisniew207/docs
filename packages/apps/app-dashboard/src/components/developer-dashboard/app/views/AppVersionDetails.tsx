import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface VersionDetailsProps {
  version: number;
  appName?: string;
  versionData: any;
  tools: any[];
}

export function VersionDetails({ version, versionData, tools }: VersionDetailsProps) {
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
          {tools && tools.length > 0 ? (
            <div className="space-y-3">
              {tools.map((tool: any, index: number) => (
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
