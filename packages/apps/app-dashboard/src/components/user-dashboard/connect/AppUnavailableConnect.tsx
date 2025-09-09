import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { ReadAuthInfo } from '@/hooks/user-dashboard/useAuthInfo';
import { ConnectPageHeader } from './ui/ConnectPageHeader';
import { ConnectAppHeader } from './ui/ConnectAppHeader';
import { ActionCard } from './ui/ActionCard';
import { ConnectFooter } from '../ui/Footer';
import { theme } from './ui/theme';
import { InfoBanner } from './ui/InfoBanner';
import { App } from '@/types/developer-dashboard/appTypes';

interface AppUnavailableConnectProps {
  appData: App;
  readAuthInfo: ReadAuthInfo;
  activeVersion?: number;
}

export function AppUnavailableConnect({ 
  appData, 
  readAuthInfo,
  activeVersion
}: AppUnavailableConnectProps) {
  const navigate = useNavigate();

  const handleGoBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handleUnpermit = useCallback(() => {
    navigate(`/user/appId/${appData.appId}`);
  }, [navigate, appData.appId]);

  return (
    <div
      className={`max-w-md mx-auto ${theme.mainCard} border ${theme.mainCardBorder} rounded-2xl shadow-2xl overflow-hidden relative z-10 origin-center`}
    >
      {/* Header */}
      <ConnectPageHeader authInfo={readAuthInfo.authInfo!} />

      <div className="px-3 sm:px-4 py-6 sm:py-8 space-y-6">
        {/* App Header */}
        <ConnectAppHeader app={appData} />

        {/* Dividing line */}
        <div className={`border-b ${theme.cardBorder}`}></div>

        {/* App Unavailable Information */}
        <div className="space-y-4">
          <InfoBanner
            type="red"
            title="App Unavailable"
            message={`Both your previously permitted version and the app's active version${activeVersion ? ` (${activeVersion})` : ''} have been disabled by the app developer.${appData.contactEmail ? ` Contact them at ${appData.contactEmail}` : ''}`}
          />
        </div>

        {/* Options */}
        <div className="space-y-3">
          <div className="space-y-2">
            {appData.appUserUrl && (
              <ActionCard
                icon={
                  <svg
                    className="w-4 h-4 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                }
                iconBg="bg-green-500/20"
                title="Visit App Website"
                description=""
                onClick={() => window.open(appData.appUserUrl, '_blank')}
              />
            )}
            <ActionCard
              icon={
                <svg
                  className="w-4 h-4 text-orange-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              }
              iconBg="bg-orange-500/20"
              title="Unpermit App"
              description=""
              onClick={handleUnpermit}
            />
            <ActionCard
              icon={<ArrowRight className="w-4 h-4 text-gray-500 rotate-180" />}
              iconBg="bg-gray-500/20"
              title="Go Back"
              description=""
              onClick={handleGoBack}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <ConnectFooter />
    </div>
  );
}