import { ConsentInfoMap } from '@/hooks/user-dashboard/useConsentInfo';
import { WarningBanner } from './WarningBanner';
import { ConsentAppHeader } from './ConsentAppHeader';
import { AppsAndVersions } from './AppsAndVersions';
import { ActionButtons } from './ActionButtons';
import { PolicyFormRef } from './PolicyForm';
import { ThemeType } from './theme';

interface MainContentProps {
  consentInfoMap: ConsentInfoMap;
  theme: ThemeType;
  isDark: boolean;
  formData: Record<string, any>;
  onFormChange: (policyId: string, data: any) => void;
  onDecline?: () => void;
  onSubmit: () => void;
  onRegisterFormRef: (policyId: string, ref: PolicyFormRef) => void;
}

export function MainContent({
  consentInfoMap,
  theme,
  isDark,
  formData,
  onFormChange,
  onDecline,
  onSubmit,
  onRegisterFormRef,
}: MainContentProps) {
  const app = consentInfoMap.app;

  return (
    <div className="px-6 py-8 space-y-6">
      {/* Warning Banner */}
      <WarningBanner theme={theme} />

      {/* App Header */}
      <ConsentAppHeader app={app} theme={theme} />

      {/* Apps and Versions */}
      <AppsAndVersions
        consentInfoMap={consentInfoMap}
        theme={theme}
        isDark={isDark}
        formData={formData}
        onFormChange={onFormChange}
        onRegisterFormRef={onRegisterFormRef}
      />

      {/* Action Buttons */}
      <ActionButtons
        onDecline={onDecline}
        onSubmit={onSubmit}
        theme={theme}
      />
    </div>
  );
} 