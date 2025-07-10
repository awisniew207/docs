import { useState, useCallback, useRef } from 'react';
import { ConsentInfoMap } from '@/hooks/user-dashboard/useConsentInfo';
import { ConsentHeader } from './ui/ConsentHeader';
import { MainContent } from './ui/MainContent';
import { theme } from './ui/theme';
import { PolicyFormRef } from './ui/PolicyForm';

interface ConsentPageProps {
  consentInfoMap: ConsentInfoMap;
  onConsent?: (formData: Record<string, any>) => void;
  onDecline?: () => void;
}

export function ConsentPage({ consentInfoMap, onConsent, onDecline }: ConsentPageProps) {
  const [isDark, setIsDark] = useState(true);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const formRefs = useRef<Record<string, PolicyFormRef>>({});

  // Use the theme function
  const themeStyles = theme(isDark);

  const handleFormChange = useCallback((policyId: string, data: any) => {
    setFormData(prev => ({
      ...prev,
      [policyId]: data.formData
    }));
  }, []);

  const handleSubmit = useCallback(() => {
    // Check if all forms are valid using RJSF's built-in validateForm method
    const allValid = Object.values(formRefs.current).every(formRef => {
      return formRef.validateForm();
    });

    if (allValid) {
      console.log('All forms valid, submitting:', formData);
      if (onConsent) {
        onConsent(formData);
      }
    } else {
      console.log('Some forms have validation errors');
      // Errors will be shown inline automatically by RJSF
    }
  }, [formData, onConsent]);

  const handleToggleTheme = useCallback(() => {
    setIsDark(!isDark);
  }, [isDark]);

  const registerFormRef = useCallback((policyId: string, ref: PolicyFormRef) => {
    formRefs.current[policyId] = ref;
  }, []);

  return (
    <div className={`min-h-screen w-full transition-colors duration-500 ${themeStyles.bg} p-4`}>
      {/* Main Card Container */}
      <div
        className={`max-w-6xl mx-auto ${themeStyles.mainCard} border ${themeStyles.mainCardBorder} rounded-2xl shadow-2xl overflow-hidden`}
      >
        {/* Header */}
        <ConsentHeader
          isDark={isDark}
          onToggleTheme={handleToggleTheme}
          theme={themeStyles}
        />

        {/* Main Content */}
        <MainContent
          consentInfoMap={consentInfoMap}
          theme={themeStyles}
          isDark={isDark}
          formData={formData}
          onFormChange={handleFormChange}
          onDecline={onDecline}
          onSubmit={handleSubmit}
          onRegisterFormRef={registerFormRef}
        />
      </div>
    </div>
  );
}