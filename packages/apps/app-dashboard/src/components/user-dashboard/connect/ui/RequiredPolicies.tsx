import { FileText } from 'lucide-react';
import { ConnectInfoMap } from '@/hooks/user-dashboard/connect/useConnectInfo';
import { Logo } from '@/components/shared/ui/Logo';
import { PolicyForm, PolicyFormRef } from './PolicyForm';
import { theme } from './theme';
import { PolicyVersion } from '@/types/developer-dashboard/appTypes';

interface RequiredPoliciesProps {
  policies: Array<PolicyVersion>;
  connectInfoMap: ConnectInfoMap;
  formData: Record<string, any>;
  onFormChange: (abilityIpfsCid: string, policyIpfsCid: string, data: any) => void;
  onRegisterFormRef: (policyIpfsCid: string, ref: PolicyFormRef) => void;
  abilityIpfsCid: string;
}

export function RequiredPolicies({
  policies,
  connectInfoMap,
  formData,
  onFormChange,
  onRegisterFormRef,
  abilityIpfsCid,
}: RequiredPoliciesProps) {
  if (policies.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 mt-3">
      {policies.map((policy) => {
        const policyData = connectInfoMap.policiesByPackageName[policy.packageName];

        return (
          <div key={policy.ipfsCid} className="">
            <div className="flex items-start gap-3">
              <div className="flex items-center mt-0.5">
                {policyData?.logo && policyData.logo.length >= 10 ? (
                  <Logo
                    logo={policyData.logo}
                    alt={`${policy.packageName} logo`}
                    className="w-6 h-6 object-contain"
                  />
                ) : (
                  <FileText className={`w-6 h-6 ${theme.textMuted}`} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h6 className={`font-medium text-sm ${theme.text}`}>
                    {connectInfoMap.policiesByPackageName[policy.packageName]?.title ||
                      policy.packageName}
                  </h6>
                  <a
                    href={`https://www.npmjs.com/package/${policy.packageName}/v/${policy.version}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:opacity-75 transition-opacity"
                    title={`View ${policy.packageName} on npm`}
                  >
                    <div className="w-4 h-4 flex items-center justify-center">
                      <img src="/npm.png" alt="npm" className="w-full h-full object-contain" />
                    </div>
                  </a>
                  <a
                    href={`https://ipfs.io/ipfs/${policy.ipfsCid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:opacity-75 transition-opacity"
                    title={`View ${policy.ipfsCid} on IPFS`}
                  >
                    <div className="w-4 h-4 flex items-center justify-center">
                      <img src="/ipfs.png" alt="IPFS" className="w-full h-full object-contain" />
                    </div>
                  </a>
                </div>
                {connectInfoMap.policiesByPackageName[policy.packageName]?.description && (
                  <p className={`text-xs ${theme.textSubtle}`}>
                    {connectInfoMap.policiesByPackageName[policy.packageName].description}
                  </p>
                )}
              </div>
            </div>

            {/* Form */}
            <div className="mt-3">
              {/* Policy Form */}
              <PolicyForm
                ref={(ref) => {
                  if (ref) {
                    onRegisterFormRef(policy.ipfsCid, ref);
                  }
                }}
                policy={policy}
                formData={formData[abilityIpfsCid] || {}}
                onFormChange={(policyIpfsCid, data) => {
                  onFormChange(abilityIpfsCid, policyIpfsCid, data);
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
