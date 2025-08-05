import { Policy } from '@/types/developer-dashboard/appTypes';
import { Shield } from 'lucide-react';
import { PolicyVersionInfoView } from './PolicyVersionInfoView';

interface AbilityVersionPoliciesViewProps {
  supportedPolicies: Policy[];
}

export function AbilityVersionPoliciesView({ supportedPolicies }: AbilityVersionPoliciesViewProps) {
  return (
    <div className="space-y-4">
      {/* Supported Policies Header */}
      <div className="flex items-center gap-3 mb-4">
        <Shield className="w-4 h-4 text-orange-500" />
        <span className="text-sm font-light text-gray-600">
          Supported Policies ({supportedPolicies.length})
        </span>
      </div>

      {supportedPolicies.length === 0 ? (
        <div className="p-8 rounded-xl bg-black/[0.02] border border-black/5 text-center">
          <Shield className="w-10 h-10 text-black/20 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No supported policies found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {supportedPolicies.map((policy) => (
            <PolicyVersionInfoView key={policy.packageName} policy={policy} />
          ))}
        </div>
      )}
    </div>
  );
}
