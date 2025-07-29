import { motion } from 'framer-motion';
import { ConsentInfoMap } from '@/hooks/user-dashboard/consent/useConsentInfo';
import { AbilityAccordion } from '@/components/user-dashboard/consent/ui/AbilityAccordion';
import { PolicyFormRef } from '@/components/user-dashboard/consent/ui/PolicyForm';
import { ThemeType } from '@/components/user-dashboard/consent/ui/theme';

interface AppsAndVersionsProps {
  consentInfoMap: ConsentInfoMap;
  theme: ThemeType;
  isDark: boolean;
  formData: Record<string, any>;
  onFormChange: (abilityIpfsCid: string, policyIpfsCid: string, data: any) => void;
  onRegisterFormRef: (policyIpfsCid: string, ref: PolicyFormRef) => void;
  permittedVersion?: string; // Optional prop to specify a specific version to render
}

export function PermittedAppInfo({
  consentInfoMap,
  theme,
  isDark,
  formData,
  onFormChange,
  onRegisterFormRef,
  permittedVersion,
}: AppsAndVersionsProps) {
  const appNames = Object.keys(consentInfoMap.versionsByApp);

  return (
    <>
      {appNames.map((appName, appIndex) => {
        const versions = consentInfoMap.versionsByApp[appName];

        // Skip if no version to use
        if (!permittedVersion) return null;

        const version = versions.find(
          (version) => version.version.toString() === permittedVersion.toString(),
        );

        if (!version) return null;

        return (
          <motion.div
            key={appName}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: appIndex * 0.1 }}
            className="space-y-4"
          >
            {(() => {
              const versionKey = `${appName}-${version.version}`;
              const appVersionAbilities =
                consentInfoMap.appVersionAbilitiesByAppVersion[versionKey] || [];

              return (
                <>
                  {appVersionAbilities.map((ability) => {
                    const abilityKey = `${ability.abilityPackageName}-${ability.abilityVersion}`;
                    const policies =
                      consentInfoMap.supportedPoliciesByAbilityVersion[abilityKey] || [];

                    // Filter out policies that are in hiddenSupportedPolicies
                    const visiblePolicies = policies.filter((policy) => {
                      if (
                        !ability.hiddenSupportedPolicies ||
                        ability.hiddenSupportedPolicies.length === 0
                      ) {
                        return true; // Show all policies if no hidden policies specified
                      }
                      return !ability.hiddenSupportedPolicies.includes(policy.packageName);
                    });

                    const abilityVersions =
                      consentInfoMap.abilityVersionsByAppVersionAbility[abilityKey] || [];
                    const abilityVersion = abilityVersions[0];

                    return (
                      <AbilityAccordion
                        key={abilityKey}
                        ability={ability}
                        abilityVersion={abilityVersion}
                        policies={visiblePolicies}
                        consentInfoMap={consentInfoMap}
                        theme={theme}
                        isDark={isDark}
                        formData={formData}
                        onFormChange={onFormChange}
                        onRegisterFormRef={onRegisterFormRef}
                        abilityIpfsCid={abilityVersion.ipfsCid}
                        defaultExpanded={false} // All abilities start closed
                      />
                    );
                  })}
                </>
              );
            })()}
          </motion.div>
        );
      })}
    </>
  );
}
