import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/shared/ui/card';
import { ConsentInfoMap } from '@/hooks/user-dashboard/useConsentInfo';
import { ToolHeader } from './ToolHeader';
import { RequiredPolicies } from './RequiredPolicies';
import { PolicyFormRef } from './PolicyForm';
import { ThemeType } from './theme';

interface AppsAndVersionsProps {
  consentInfoMap: ConsentInfoMap;
  theme: ThemeType;
  isDark: boolean;
  formData: Record<string, any>;
  onFormChange: (policyId: string, data: any) => void;
  onRegisterFormRef: (policyId: string, ref: PolicyFormRef) => void;
}

export function AppsAndVersions({
  consentInfoMap,
  theme,
  isDark,
  formData,
  onFormChange,
  onRegisterFormRef,
}: AppsAndVersionsProps) {
  const appNames = Object.keys(consentInfoMap.versionsByApp);

  return (
    <>
      {appNames.map((appName, appIndex) => {
        const versions = consentInfoMap.versionsByApp[appName];
        // Only show the active/enabled version for consent
        const activeVersion = versions.find((version) => version.enabled);

        // If no active version, don't show this app
        if (!activeVersion) return null;

        return (
          <motion.div
            key={appName}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: appIndex * 0.1 }}
          >
            <Card className={`backdrop-blur-xl ${theme.cardBg} border ${theme.cardBorder}`}>
              {/* Active Version Content */}
              <CardContent className="p-6">
                {(() => {
                  const versionKey = `${appName}-${activeVersion.version}`;
                  const appVersionTools =
                    consentInfoMap.appVersionToolsByAppVersion[versionKey] || [];

                  return (
                    <div className="space-y-6">
                      {appVersionTools.map((tool) => {
                        const toolKey = `${tool.toolPackageName}-${tool.toolVersion}`;
                        const policies =
                          consentInfoMap.supportedPoliciesByToolVersion[toolKey] || [];
                        
                        // Get the tool version data which contains the IPFS CID
                        const toolVersions = consentInfoMap.toolVersionsByAppVersionTool[toolKey] || [];
                        const toolVersion = toolVersions[0]; // Should only be one version per tool key

                        return (
                          <div key={toolKey} className="space-y-4">
                            {/* Tool Header */}
                            <ToolHeader
                              tool={tool}
                              toolVersion={toolVersion}
                              consentInfoMap={consentInfoMap}
                              theme={theme}
                            />

                            {/* Required Policies */}
                            <RequiredPolicies
                              policies={policies}
                              consentInfoMap={consentInfoMap}
                              theme={theme}
                              isDark={isDark}
                              formData={formData}
                              onFormChange={onFormChange}
                              onRegisterFormRef={onRegisterFormRef}
                            />
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </>
  );
} 