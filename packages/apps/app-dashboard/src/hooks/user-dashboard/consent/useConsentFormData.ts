import { useState, useEffect, useCallback } from 'react';
import { ConsentInfoMap } from './useConsentInfo';

export function useConsentFormData(consentInfoMap: ConsentInfoMap) {
  const [formData, setFormData] = useState<Record<string, any>>({});

  // Initialize formData with all policies (including hidden ones with empty values)
  useEffect(() => {
    const initialFormData: Record<string, any> = {};

    const appNames = Object.keys(consentInfoMap.versionsByApp);
    appNames.forEach((appName) => {
      const versions = consentInfoMap.versionsByApp[appName];
      const activeVersion = versions.find(
        (version) => version.version === consentInfoMap.app.activeVersion,
      );

      if (activeVersion) {
        const versionKey = `${appName}-${activeVersion.version}`;
        const appVersionTools = consentInfoMap.appVersionToolsByAppVersion[versionKey] || [];

        appVersionTools.forEach((tool) => {
          const toolKey = `${tool.toolPackageName}-${tool.toolVersion}`;
          const policies = consentInfoMap.supportedPoliciesByToolVersion[toolKey] || [];
          const toolVersions = consentInfoMap.toolVersionsByAppVersionTool[toolKey] || [];
          const toolVersion = toolVersions[0];

          if (toolVersion) {
            initialFormData[toolVersion.ipfsCid] = {};

            // Add all policies (including hidden ones) with empty values
            policies.forEach((policy) => {
              initialFormData[toolVersion.ipfsCid][policy.ipfsCid] = {};
            });
          }
        });
      }
    });

    setFormData(initialFormData);
  }, [consentInfoMap]);

  const handleFormChange = useCallback((toolIpfsCid: string, policyIpfsCid: string, data: any) => {
    setFormData((prev) => ({
      ...prev,
      [toolIpfsCid]: {
        ...prev[toolIpfsCid],
        [policyIpfsCid]: data.formData,
      },
    }));
  }, []);

  return {
    formData,
    handleFormChange,
  };
}
