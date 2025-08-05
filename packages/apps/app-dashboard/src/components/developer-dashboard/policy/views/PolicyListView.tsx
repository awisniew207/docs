import { useNavigate } from 'react-router';
import { Plus } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shared/ui/card';
import { formatDate } from '@/utils/developer-dashboard/formatDateAndTime';
import { UndeletePolicyButton } from '../wrappers';
import { Policy } from '@/types/developer-dashboard/appTypes';

interface PolicyListViewProps {
  policies: Policy[];
  deletedPolicies: Policy[];
}

export function PolicyListView({ policies, deletedPolicies }: PolicyListViewProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-neutral-800 dark:text-white">Your Policies</h1>
      </div>

      {policies.length === 0 ? (
        <div className="border dark:border-white/10 rounded-lg p-8 text-center">
          <h2 className="text-xl font-semibold mb-4 text-neutral-800 dark:text-white">
            No Policies Yet
          </h2>
          <p className="text-gray-600 dark:text-white/60 mb-6">
            Create your first policy to get started with Vincent.
          </p>
          <Button
            variant="outline"
            className="text-gray-700 dark:text-white dark:border-white/20"
            onClick={() => navigate('/developer/create-policy')}
          >
            <Plus className="h-4 w-4 mr-2 font-bold text-gray-700 dark:text-white" />
            Create Policy
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {policies.map((policy) => (
            <Card
              key={policy.packageName}
              className="cursor-pointer hover:shadow-md dark:hover:bg-white/[0.02] dark:border-white/10 transition-shadow"
              onClick={() =>
                navigate(`/developer/policy/${encodeURIComponent(policy.packageName)}`)
              }
            >
              <CardHeader>
                <CardTitle className="text-neutral-800 dark:text-white">
                  {policy.packageName}
                </CardTitle>
                <CardDescription className="text-gray-700 dark:text-white/60">
                  {policy.description || 'No description available'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-700 dark:text-white/60">
                  <div className="space-y-1">
                    <div>
                      <span className="font-medium">Version:</span> {policy.activeVersion}
                    </div>
                    <div>
                      <span className="font-medium">Created:</span> {formatDate(policy.createdAt)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {/* Deleted Policies Section */}
      {deletedPolicies && deletedPolicies.length > 0 && (
        <div className="space-y-4">
          <div className="border-t dark:border-white/10 pt-6">
            <h3 className="text-lg font-medium text-gray-600 dark:text-white/60 mb-4">
              Deleted Policies
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {deletedPolicies.map((policy) => (
                <Card key={policy.packageName} className="border-dashed dark:border-white/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex justify-between items-start text-gray-600 dark:text-white/60">
                      <div className="flex items-center gap-3">
                        <span className="line-through">{policy.packageName}</span>
                        <span className="text-xs px-2 py-1 rounded-full bg-red-50 dark:bg-red-900/20 text-red-400">
                          DELETED
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-white/50">
                          v{policy.activeVersion}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <UndeletePolicyButton policy={policy} />
                      </div>
                    </CardTitle>
                    <CardDescription className="text-gray-500 dark:text-white/40 line-through">
                      {policy.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="text-sm text-gray-500 dark:text-white/40">
                      <div className="space-y-1">
                        <div>
                          <span className="font-medium">Version:</span> {policy.activeVersion}
                        </div>
                        <div>
                          <span className="font-medium">Created:</span>{' '}
                          {formatDate(policy.createdAt)}
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
