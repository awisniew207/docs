import { FileText, FileCode, ExternalLink } from 'lucide-react';
import { ConsentInfoMap } from '@/hooks/user-dashboard/useConsentInfo';
import { Card, CardContent } from '@/components/shared/ui/card';
import { PolicyForm, PolicyFormRef } from './PolicyForm';
import { ThemeType } from './theme';

interface RequiredPoliciesProps {
  policies: Array<{
    ipfsCid: string;
    packageName: string;
    version: string;
    parameters?: {
      jsonSchema: string;
      uiSchema: string;
    };
  }>;
  consentInfoMap: ConsentInfoMap;
  theme: ThemeType;
  isDark: boolean;
  formData: Record<string, any>;
  onFormChange: (policyId: string, data: any) => void;
  onRegisterFormRef: (policyId: string, ref: PolicyFormRef) => void;
}

export function RequiredPolicies({
  policies,
  consentInfoMap,
  theme,
  isDark,
  formData,
  onFormChange,
  onRegisterFormRef,
}: RequiredPoliciesProps) {
  if (policies.length === 0) {
    return null;
  }

  return (
    <div className="ml-4 space-y-3">
      <h5 className={`text-sm font-semibold ${theme.text} mb-3`}>
        Required Policies:
      </h5>
      {policies.map((policy) => (
        <Card
          key={policy.ipfsCid}
          className={`${theme.itemBg} border ${theme.cardBorder} ml-4`}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${theme.iconBg} border ${theme.iconBorder}`}>
                <FileText className={`w-4 h-4 ${theme.textMuted}`} />
              </div>
              <div className="flex-1">
                <h6 className={`font-semibold ${theme.text}`}>
                  {consentInfoMap.policiesByPackageName[policy.packageName]?.title ||
                    policy.packageName}
                </h6>
                <p className={`text-sm ${theme.textMuted} font-medium`}>
                  <a
                    href={`https://www.npmjs.com/package/${policy.packageName}/v/${policy.version}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${theme.linkColor} hover:underline inline-flex items-center gap-1`}
                  >
                    {policy.packageName} - v{policy.version}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
                {consentInfoMap.policiesByPackageName[policy.packageName]?.description && (
                  <p className={`text-sm ${theme.textSubtle} mt-2`}>
                    {consentInfoMap.policiesByPackageName[policy.packageName].description}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-3">
                  <FileCode className={`w-3 h-3 ${theme.textMuted}`} />
                  <span className={`text-xs ${theme.textSubtle} font-mono`}>
                    {policy.ipfsCid}
                  </span>
                </div>

                {/* Policy Form */}
                <PolicyForm
                  ref={(ref) => {
                    if (ref) {
                      onRegisterFormRef(policy.ipfsCid, ref);
                    }
                  }}
                  policy={policy}
                  isDark={isDark}
                  formData={formData}
                  onFormChange={onFormChange}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 