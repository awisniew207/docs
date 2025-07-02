import { useNavigate } from 'react-router';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { Logo } from '@/components/shared/ui/Logo';
import { useUserApps } from '@/hooks/developer-dashboard/app/useUserApps';
import Loading from '@/components/layout/Loading';
import { App, Policy, Tool } from '@/types/developer-dashboard/appTypes';
import { useUserTools } from '@/hooks/developer-dashboard/tool/useUserTools';
import { useUserPolicies } from '@/hooks/developer-dashboard/policy/useUserPolicies';
import { UndeleteAppButton } from '../app/wrappers';
import { UndeleteToolButton } from '../tool/wrappers';

interface AppsListProps {
  onCreateClick: () => void;
  onAppClick?: (app: App) => void;
}

interface ToolsListProps {
  onCreateClick: () => void;
  onToolClick?: (tool: Tool) => void;
}

interface PoliciesListProps {
  onCreateClick: () => void;
  onPolicyClick?: (policy: Policy) => void;
}

// Helper function to format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export function AppsList({ onCreateClick, onAppClick }: AppsListProps) {
  const navigate = useNavigate();
  const { data: apps, deletedApps, isLoading, isError } = useUserApps();

  if (isLoading) return <Loading />;
  if (isError) return <StatusMessage message="Failed to load apps" type="error" />;

  return (
    <div className="space-y-6">
      {apps.length === 0 ? (
        <div className="border rounded-lg p-8 text-center">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">No Apps Yet</h2>
          <p className="text-gray-600 mb-6">Create your first app to get started with Vincent.</p>
          <Button variant="outline" className="text-gray-700" onClick={onCreateClick}>
            <Plus className="h-4 w-4 mr-2 font-bold text-gray-700" />
            Create App
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {apps.map((app) => (
            <Card
              key={app.appId}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() =>
                onAppClick ? onAppClick(app) : navigate(`/developer/appId/${app.appId}`)
              }
            >
              <CardHeader>
                <CardTitle className="flex justify-between items-center text-gray-900">
                  <div className="flex items-center gap-3">
                    <Logo
                      logo={app.logo}
                      alt={`${app.name} logo`}
                      className="w-8 h-8 rounded-md object-cover flex-shrink-0"
                    />
                    <span>{app.name}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                      v{app.activeVersion}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 uppercase">
                      {app.deploymentStatus}
                    </span>
                  </div>
                </CardTitle>
                <CardDescription className="text-gray-700">{app.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-700">
                  <div>
                    <span className="font-medium">App ID:</span> {app.appId}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {/* Deleted Apps Section */}
      {deletedApps && deletedApps.length > 0 && (
        <div className="space-y-4">
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-600 mb-4">Deleted Apps</h3>
            <div className="grid grid-cols-1 gap-4">
              {deletedApps.map((app) => (
                <Card key={app.appId} className="border-dashed">
                  <CardHeader>
                    <CardTitle className="flex justify-between items-start text-gray-600">
                      <div className="flex items-center gap-3">
                        <Logo
                          logo={app.logo}
                          alt={`${app.name} logo`}
                          className="w-8 h-8 rounded-md object-cover flex-shrink-0 grayscale"
                        />
                        <span className="line-through">{app.name}</span>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex gap-2">
                          <span className="text-xs px-2 py-1 rounded-full bg-red-50 text-red-400">
                            DELETED
                          </span>
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-500">
                            v{app.activeVersion}
                          </span>
                        </div>
                        <div className="relative z-10 bg-white rounded-lg opacity-100">
                          <UndeleteAppButton app={app} />
                        </div>
                      </div>
                    </CardTitle>
                    <CardDescription className="text-gray-500 line-through">
                      {app.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-gray-700">
                      <div>
                        <span className="font-medium">App ID:</span> {app.appId}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function ToolsList({ onCreateClick, onToolClick }: ToolsListProps) {
  const navigate = useNavigate();
  const { data: tools, deletedTools, isLoading, isError } = useUserTools();

  if (isLoading) return <Loading />;
  if (isError) return <StatusMessage message="Failed to load tools" type="error" />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Your Tools</h1>
      </div>

      {tools.length === 0 ? (
        <div className="border rounded-lg p-8 text-center">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">No Tools Yet</h2>
          <p className="text-gray-600 mb-6">Create your first tool to get started with Vincent.</p>
          <Button variant="outline" className="text-gray-700" onClick={onCreateClick}>
            <Plus className="h-4 w-4 mr-2 font-bold text-gray-700" />
            Create Tool
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {tools.map((tool) => (
            <Card
              key={tool.packageName}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() =>
                onToolClick
                  ? onToolClick(tool)
                  : navigate(`/toolId/${encodeURIComponent(tool.packageName)}`)
              }
            >
              <CardHeader>
                <CardTitle className="text-gray-900">{tool.packageName}</CardTitle>
                <CardDescription className="text-gray-700">
                  {tool.description || 'No description available'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-700">
                  <div className="space-y-1">
                    <div>
                      <span className="font-medium">Version:</span> {tool.activeVersion || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Created:</span>{' '}
                      {tool.createdAt ? formatDate(tool.createdAt) : 'N/A'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {/* Deleted Tools Section */}
      {deletedTools && deletedTools.length > 0 && (
        <div className="space-y-4">
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-600 mb-4">Deleted Tools</h3>
            <div className="grid grid-cols-1 gap-4">
              {deletedTools.map((tool) => (
                <Card key={tool.packageName} className="border-dashed">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex justify-between items-start text-gray-600">
                      <div className="flex items-center gap-3">
                        <span className="line-through">{tool.packageName}</span>
                        <span className="text-xs px-2 py-1 rounded-full bg-red-50 text-red-400">
                          DELETED
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-500">
                          v{tool.activeVersion}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <UndeleteToolButton tool={tool} />
                      </div>
                    </CardTitle>
                    <CardDescription className="text-gray-500 line-through">
                      {tool.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="text-sm text-gray-500">
                      <div className="space-y-1">
                        <div>
                          <span className="font-medium">Version:</span>{' '}
                          {tool.activeVersion || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium">Created:</span>{' '}
                          {tool.createdAt ? formatDate(tool.createdAt) : 'N/A'}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function PoliciesList({ onCreateClick, onPolicyClick }: PoliciesListProps) {
  const navigate = useNavigate();
  const { data: policies, isLoading, isError } = useUserPolicies();

  if (isLoading) return <Loading />;
  if (isError) return <StatusMessage message="Failed to load policies" type="error" />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Your Policies</h1>
      </div>

      {policies.length === 0 ? (
        <div className="border rounded-lg p-8 text-center">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">No Policies Yet</h2>
          <p className="text-gray-600 mb-6">
            Create your first policy to get started with Vincent.
          </p>
          <Button variant="outline" className="text-gray-700" onClick={onCreateClick}>
            <Plus className="h-4 w-4 mr-2 font-bold text-gray-700" />
            Create Policy
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {policies.map((policy) => (
            <Card
              key={policy.packageName}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() =>
                onPolicyClick
                  ? onPolicyClick(policy)
                  : navigate(`/policyId/${encodeURIComponent(policy.packageName)}`)
              }
            >
              <CardHeader>
                <CardTitle className="text-gray-900">{policy.packageName}</CardTitle>
                <CardDescription className="text-gray-700">
                  {policy.description || 'No description available'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-700">
                  <div className="space-y-1">
                    <div>
                      <span className="font-medium">Version:</span> {policy.activeVersion || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Created:</span>{' '}
                      {policy.createdAt ? formatDate(policy.createdAt) : 'N/A'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
