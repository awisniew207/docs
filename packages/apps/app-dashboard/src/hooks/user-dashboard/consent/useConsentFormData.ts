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
        const appVersionAbilities =
          consentInfoMap.appVersionAbilitiesByAppVersion[versionKey] || [];

        appVersionAbilities.forEach((ability) => {
          const abilityKey = `${ability.abilityPackageName}-${ability.abilityVersion}`;
          const policies = consentInfoMap.supportedPoliciesByAbilityVersion[abilityKey] || [];
          const abilityVersions =
            consentInfoMap.abilityVersionsByAppVersionAbility[abilityKey] || [];
          const abilityVersion = abilityVersions[0];

          if (abilityVersion) {
            initialFormData[abilityVersion.ipfsCid] = {};

            // Add all policies (including hidden ones) with empty values
            policies.forEach((policy) => {
              initialFormData[abilityVersion.ipfsCid][policy.ipfsCid] = {};
            });
          }
        });
      }
    });

    setFormData(initialFormData);
  }, [consentInfoMap]);

  const handleFormChange = useCallback(
    (abilityIpfsCid: string, policyIpfsCid: string, data: any) => {
      setFormData((prev) => ({
        ...prev,
        [abilityIpfsCid]: {
          ...prev[abilityIpfsCid],
          [policyIpfsCid]: data.formData,
        },
      }));
    },
    [],
  );

  return {
    formData,
    handleFormChange,
  };
}
