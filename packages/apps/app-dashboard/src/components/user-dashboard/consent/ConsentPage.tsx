import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Sun,
  Moon,
  Package,
  FileText,
  AlertCircle,
  Lock,
  ArrowLeft,
  FileCode,
  ExternalLink,
} from 'lucide-react';
import { RJSFSchema, UiSchema } from '@rjsf/utils';
import Form from '@rjsf/shadcn';
import validator from '@rjsf/validator-ajv8'; // Changed from ajvValidator import
import { ConsentInfoMap } from '@/hooks/user-dashboard/useConsentInfo';
import { Logo } from '@/components/shared/ui/Logo';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shared/ui/card';

interface ConsentPageProps {
  consentInfoMap: ConsentInfoMap;
  onConsent?: (formData: Record<string, any>) => void;
  onDecline?: () => void;
}

export function ConsentPage({ consentInfoMap, onConsent, onDecline }: ConsentPageProps) {
  const [isDark, setIsDark] = useState(true);
  const [formData, setFormData] = useState<Record<string, any>>({});

  // Theme classes
  const theme = {
    bg: isDark ? 'bg-black' : 'bg-gray-50',
    text: isDark ? 'text-white' : 'text-gray-900',
    textMuted: isDark ? 'text-white/60' : 'text-gray-600',
    textSubtle: isDark ? 'text-white/40' : 'text-gray-500',
    cardBg: isDark ? 'bg-black/40' : 'bg-white/80',
    cardBorder: isDark ? 'border-white/10' : 'border-gray-200',
    cardHoverBorder: isDark ? 'hover:border-white/20' : 'hover:border-gray-300',
    itemBg: isDark ? 'bg-white/[0.02]' : 'bg-gray-100/50',
    itemHoverBg: isDark ? 'hover:bg-white/[0.05]' : 'hover:bg-gray-100',
    iconBg: isDark ? 'bg-white/5' : 'bg-gray-200/50',
    iconBorder: isDark ? 'border-white/10' : 'border-gray-300',
    accentBg: isDark ? 'bg-white text-black' : 'bg-gray-900 text-white',
    accentHover: isDark ? 'hover:bg-gray-100' : 'hover:bg-gray-800',
    warningBg: isDark ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-yellow-50 border-yellow-300',
    warningText: isDark ? 'text-yellow-400' : 'text-yellow-700',
    mainCard: isDark ? 'bg-gray-900' : 'bg-white',
    mainCardBorder: isDark ? 'border-white/10' : 'border-gray-200',
    linkColor: isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500',
  };

  const handleFormChange = useCallback((policyId: string, data: any) => {
    setFormData(prev => ({
      ...prev,
      [policyId]: data.formData
    }));
  }, []);

  const handleSubmit = useCallback(() => {
    console.log('Form data:', formData);
    if (onConsent) {
      onConsent(formData);
    }
  }, [formData, onConsent]);

  const appNames = Object.keys(consentInfoMap.versionsByApp);
  const app = consentInfoMap.app;

  return (
    <div className={`min-h-screen w-full transition-colors duration-500 ${theme.bg} p-4`}>
      {/* Main Card Container */}
      <div
        className={`max-w-6xl mx-auto ${theme.mainCard} border ${theme.mainCardBorder} rounded-2xl shadow-2xl overflow-hidden`}
      >
        {/* Header */}
        <div className={`backdrop-blur-xl ${theme.cardBg} border-b ${theme.cardBorder}`}>
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.button
                  className={`flex items-center gap-2 p-2 rounded-full ${theme.itemBg} border ${theme.cardBorder} ${theme.cardHoverBorder} transition-all duration-300`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ArrowLeft className={`w-5 h-5 ${theme.text}`} />
                  <span className={`text-sm ${theme.text}`}>Home</span>
                </motion.button>
              </div>
              
              {/* Theme Toggle */}
              <button
                onClick={() => setIsDark(!isDark)}
                className={`p-2 rounded-full ${theme.itemBg} border ${theme.cardBorder} ${theme.cardHoverBorder} transition-all duration-300`}
              >
                {isDark ? (
                  <Sun className={`w-5 h-5 ${theme.text}`} />
                ) : (
                  <Moon className={`w-5 h-5 ${theme.text}`} />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-6 py-8 space-y-6">
          {/* Warning Banner */}
          <Card className={`border ${theme.warningBg}`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className={`w-5 h-5 ${theme.warningText} flex-shrink-0 mt-0.5`} />
                <div className="flex-1">
                  <p className={`text-sm ${theme.warningText} font-medium`}>
                    Review Permissions Carefully
                  </p>
                  <p
                    className={`text-sm ${isDark ? 'text-yellow-400/70' : 'text-yellow-600'} mt-1`}
                  >
                    You are about to grant permissions to an application. These can be revoked at
                    any time in the Dashboard.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* App Header */}
          <Card className={`backdrop-blur-xl ${theme.cardBg} border ${theme.cardBorder}`}>
            <CardHeader className={`border-b ${theme.cardBorder}`}>
              <CardTitle className="flex items-center gap-3">
                {app && (
                  <Logo
                    logo={app.logo}
                    alt={`${app.name} logo`}
                    className="w-8 h-8 rounded-lg object-cover"
                  />
                )}
                <div>
                  <h2 className={`text-xl font-semibold ${theme.text}`}>
                    {app ? app.name : 'Application'}
                  </h2>
                  <CardDescription className={`text-sm ${theme.textMuted}`}>
                    Configure policies and grant permissions
                  </CardDescription>
                </div>
              </CardTitle>
            </CardHeader>
          </Card>

          {/* Apps and Versions */}
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
                          {appVersionTools.map((tool, toolIndex) => {
                            const toolKey = `${tool.toolPackageName}-${tool.toolVersion}`;
                            const policies =
                              consentInfoMap.supportedPoliciesByToolVersion[toolKey] || [];
                            
                            // Get the tool version data which contains the IPFS CID
                            const toolVersions = consentInfoMap.toolVersionsByAppVersionTool[toolKey] || [];
                            const toolVersion = toolVersions[0]; // Should only be one version per tool key

                            return (
                              <div key={toolKey} className="space-y-4">
                                {/* Tool Header - NOT an accordion */}
                                <div className={`${theme.itemBg} border ${theme.cardBorder} rounded-lg p-4`}>
                                  <div className="flex items-start gap-3">
                                    <div
                                      className={`p-2 rounded-lg ${theme.iconBg} border ${theme.iconBorder}`}
                                    >
                                      <Package className={`w-4 h-4 ${theme.textMuted}`} />
                                    </div>
                                    <div className="flex-1">
                                      <h4 className={`font-semibold text-lg ${theme.text}`}>
                                        {consentInfoMap.toolsByPackageName[tool.toolPackageName]
                                          ?.title || tool.toolPackageName}
                                      </h4>
                                      <p className={`text-sm ${theme.textMuted} font-medium`}>
                                        <a
                                          href={`https://www.npmjs.com/package/${tool.toolPackageName}/v/${tool.toolVersion}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className={`${theme.linkColor} hover:underline inline-flex items-center gap-1`}
                                        >
                                          {tool.toolPackageName} - Version {tool.toolVersion}
                                          <ExternalLink className="w-3 h-3" />
                                        </a>
                                      </p>
                                      {consentInfoMap.toolsByPackageName[tool.toolPackageName]?.description && (
                                        <p className={`text-sm ${theme.textSubtle} mt-2`}>
                                          {consentInfoMap.toolsByPackageName[tool.toolPackageName].description}
                                        </p>
                                      )}
                                      {/* Tool IPFS CID */}
                                      {toolVersion?.ipfsCid && (
                                        <div className="flex items-center gap-2 mt-3">
                                          <FileCode
                                            className={`w-3 h-3 ${theme.textMuted}`}
                                          />
                                          <span
                                            className={`text-xs ${theme.textSubtle} font-mono`}
                                          >
                                            {toolVersion.ipfsCid}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Required Policies */}
                                {policies.length > 0 && (
                                  <div className="ml-4 space-y-3">
                                    <h5 className={`text-sm font-semibold ${theme.text} mb-3`}>
                                      Required Policies:
                                    </h5>
                                    {policies.map((policy, policyIndex) => (
                                      <Card
                                        key={policy.ipfsCid}
                                        className={`${theme.itemBg} border ${theme.cardBorder} ml-4`}
                                      >
                                        <CardContent className="p-4">
                                          <div className="flex items-start gap-3">
                                            <div
                                              className={`p-2 rounded-lg ${theme.iconBg} border ${theme.iconBorder}`}
                                            >
                                              <FileText className={`w-4 h-4 ${theme.textMuted}`} />
                                            </div>
                                            <div className="flex-1">
                                              <h6 className={`font-semibold ${theme.text}`}>
                                                {consentInfoMap.policiesByPackageName[
                                                  policy.packageName
                                                ]?.title || policy.packageName}
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
                                                <FileCode
                                                  className={`w-3 h-3 ${theme.textMuted}`}
                                                />
                                                <span
                                                  className={`text-xs ${theme.textSubtle} font-mono`}
                                                >
                                                  {policy.ipfsCid}
                                                </span>
                                              </div>

                                              {/* Policy Form */}
                                              {policy.parameters?.jsonSchema && policy.parameters?.uiSchema && (
                                                <div className="mt-4 p-4 bg-opacity-50 rounded-lg border border-opacity-20">
                                                  <style>
                                                    {`
                                                      .policy-form-${policy.ipfsCid} label {
                                                        color: ${isDark ? 'rgb(255 255 255 / 0.9)' : 'rgb(17 24 39)'};
                                                        font-weight: 500;
                                                        margin-bottom: 0.5rem;
                                                        display: block;
                                                      }
                                                      
                                                      .policy-form-${policy.ipfsCid} input,
                                                      .policy-form-${policy.ipfsCid} textarea,
                                                      .policy-form-${policy.ipfsCid} select {
                                                        background-color: ${isDark ? 'rgb(255 255 255 / 0.05)' : 'rgb(249 250 251)'};
                                                        border: 1px solid ${isDark ? 'rgb(255 255 255 / 0.1)' : 'rgb(209 213 219)'};
                                                        color: ${isDark ? 'rgb(255 255 255 / 0.9)' : 'rgb(17 24 39)'};
                                                        border-radius: 0.5rem;
                                                        padding: 0.75rem;
                                                        width: 100%;
                                                        transition: all 0.2s ease;
                                                      }
                                                      
                                                      .policy-form-${policy.ipfsCid} input:focus,
                                                      .policy-form-${policy.ipfsCid} textarea:focus,
                                                      .policy-form-${policy.ipfsCid} select:focus {
                                                        outline: none;
                                                        border-color: ${isDark ? 'rgb(255 255 255 / 0.3)' : 'rgb(59 130 246)'};
                                                        box-shadow: 0 0 0 3px ${isDark ? 'rgb(255 255 255 / 0.1)' : 'rgb(59 130 246 / 0.1)'};
                                                      }
                                                      
                                                      .policy-form-${policy.ipfsCid} input::placeholder,
                                                      .policy-form-${policy.ipfsCid} textarea::placeholder {
                                                        color: ${isDark ? 'rgb(255 255 255 / 0.4)' : 'rgb(107 114 128)'};
                                                      }
                                                      
                                                      .policy-form-${policy.ipfsCid} .field-description {
                                                        color: ${isDark ? 'rgb(255 255 255 / 0.6)' : 'rgb(107 114 128)'};
                                                        font-size: 0.875rem;
                                                        margin-top: 0.25rem;
                                                      }
                                                      
                                                      .policy-form-${policy.ipfsCid} .field-error {
                                                        color: ${isDark ? 'rgb(248 113 113)' : 'rgb(239 68 68)'};
                                                        font-size: 0.875rem;
                                                        margin-top: 0.25rem;
                                                      }
                                                      
                                                      .policy-form-${policy.ipfsCid} button[type="submit"] {
                                                        display: none;
                                                      }
                                                    `}
                                                  </style>
                                                  <div className={`policy-form-${policy.ipfsCid}`}>
                                                    <Form
                                                      schema={JSON.parse(policy.parameters.jsonSchema) as RJSFSchema}
                                                      uiSchema={JSON.parse(policy.parameters.uiSchema) as UiSchema}
                                                      formData={formData[policy.ipfsCid] || {}}
                                                      validator={validator} // Fixed: using the correct validator import
                                                      liveValidate={false}
                                                      onChange={(data) => handleFormChange(policy.ipfsCid, data)}
                                                      onSubmit={() => {}} // Disable individual form submission
                                                    />
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    ))}
                                  </div>
                                )}
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

          {/* Action Buttons */}
            <motion.div 
              className="flex gap-4 pt-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <button
                onClick={onDecline}
                className={`flex-1 px-6 py-3 rounded-full border ${theme.cardBorder} ${theme.cardHoverBorder} ${theme.text} transition-all duration-300 hover:bg-gray-500/10`}
              >
                Decline
              </button>
              <button
              onClick={handleSubmit}
                className={`flex-1 px-6 py-3 rounded-full ${theme.accentBg} transition-all duration-300 ${theme.accentHover} flex items-center justify-center gap-2`}
              >
                <Lock className="w-4 h-4" />
                Grant Permissions
              </button>
            </motion.div>
        </div>
      </div>
    </div>
  );
}