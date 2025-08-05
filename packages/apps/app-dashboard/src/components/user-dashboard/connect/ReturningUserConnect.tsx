import { Card, CardContent } from '@/components/shared/ui/card';
import { useJwtRedirect } from '@/hooks/user-dashboard/connect/useJwtRedirect';
import { Settings, ArrowRight, RefreshCw } from 'lucide-react';
import { theme } from '@/components/user-dashboard/connect/ui/theme';
import { ConnectAppHeader } from './ui/ConnectAppHeader';
import { ConnectPageHeader } from './ui/ConnectPageHeader';
import { InfoBanner } from './ui/InfoBanner';
import { ActionCard } from './ui/ActionCard';
import { useNavigate } from 'react-router-dom';
import { UseReadAuthInfo } from '@/hooks/user-dashboard/useAuthInfo';
import { App, AppVersion } from '@/types/developer-dashboard/appTypes';
import { useState, useEffect } from 'react';

type ReturningUserConnectProps = {
  appData: App;
  version: number;
  versionData: AppVersion;
  redirectUri?: string;
  readAuthInfo: UseReadAuthInfo;
};

export function ReturningUserConnect({
  appData,
  version,
  versionData,
  redirectUri,
  readAuthInfo,
}: ReturningUserConnectProps) {
  const navigate = useNavigate();
  const [localSuccess, setLocalSuccess] = useState<string | null>(null);
  const { generateJWT, executeRedirect, isLoading, loadingStatus, error, redirectUrl } =
    useJwtRedirect({ readAuthInfo });

  // Handle redirect when JWT is ready
  useEffect(() => {
    if (redirectUrl && !localSuccess) {
      setLocalSuccess('Success! Redirecting to app...');
      setTimeout(() => {
        executeRedirect();
      }, 2000);
    }
  }, [redirectUrl, localSuccess, executeRedirect]);

  const handleEditParameters = () => {
    const url = `/user/appId/${appData.appId}`;
    const urlWithParams = redirectUri
      ? `${url}?redirectUri=${encodeURIComponent(redirectUri)}`
      : url;
    navigate(urlWithParams);
  };

  const handleUpdateVersion = () => {
    const url = `/user/appId/${appData.appId}/update-version`;
    const urlWithParams = redirectUri
      ? `${url}?redirectUri=${encodeURIComponent(redirectUri)}`
      : url;
    navigate(urlWithParams);
  };

  const handleContinue = async () => {
    await generateJWT(appData, version);
  };

  return (
    <div className={`min-h-screen w-full transition-colors duration-500 ${theme.bg} sm:p-4`}>
      {/* Main Card Container */}
      <div
        className={`max-w-6xl mx-auto ${theme.mainCard} border ${theme.mainCardBorder} rounded-2xl shadow-2xl overflow-hidden`}
      >
        {/* Header */}
        <ConnectPageHeader authInfo={readAuthInfo.authInfo!} />

        {/* Main Content */}
        <div className="px-6 py-8 space-y-6">
          {/* App Header */}
          {appData && <ConnectAppHeader app={appData} />}

          {/* Status Banner - Show appropriate status based on version state */}
          {versionData && !versionData.enabled ? (
            <InfoBanner
              type="warning"
              title="Version Disabled"
              message={`Your permitted version (${version}) has been disabled by the app developer. You must update your permissions to continue using this app.`}
            />
          ) : version !== appData.activeVersion ? (
            <>
              <InfoBanner
                type="success"
                title="App Already Permitted"
                message="You've previously granted permissions to this app. You can continue with your existing permissions or update them."
              />
              <InfoBanner
                title="Version Update Available"
                message={`Your permitted version (${version}) is different from the app's active version (${appData.activeVersion}). Consider updating your permissions to access the latest features.`}
              />
            </>
          ) : (
            <InfoBanner
              type="success"
              title="App Already Permitted"
              message="You've previously granted permissions to this app. You can continue with your existing permissions or update them."
            />
          )}

          {/* Options Card */}
          <Card className={`backdrop-blur-xl ${theme.cardBg} border ${theme.cardBorder}`}>
            <CardContent className="p-6">
              <div className="space-y-4">
                <h2 className={`text-lg font-semibold ${theme.text}`}>
                  What would you like to do?
                </h2>

                <div className="space-y-3">
                  {/* Show different primary action based on version status */}
                  {versionData && !versionData.enabled ? (
                    /* Update Version Option - Primary action when version is disabled */
                    <ActionCard
                      icon={<RefreshCw className="w-4 h-4 text-orange-500" />}
                      iconBg="bg-orange-500/20"
                      title="Update Version"
                      description="Update to the latest version to continue using this app"
                      onClick={handleUpdateVersion}
                    />
                  ) : (
                    /* Edit Parameters Option - Show when version is enabled */
                    <ActionCard
                      icon={<Settings className="w-4 h-4 text-blue-500" />}
                      iconBg="bg-blue-500/20"
                      title="Edit Permissions"
                      description="Review and update your app permissions"
                      onClick={handleEditParameters}
                    />
                  )}

                  {/* Continue Option - Only show if version is enabled */}
                  {!(versionData && !versionData.enabled) && (
                    <ActionCard
                      icon={<ArrowRight className="w-4 h-4 text-green-500" />}
                      iconBg="bg-green-500/20"
                      title={`Continue to ${appData.name}`}
                      description="Proceed with your existing permissions"
                      onClick={handleContinue}
                      isLoading={isLoading || !!localSuccess}
                      loadingStatus={loadingStatus || (localSuccess ? localSuccess : null)}
                      error={error}
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
