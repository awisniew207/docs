import { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/shared/ui/card';
import { ShieldOff, ArrowLeft, RefreshCw, Moon, Sun, LogIn, ChevronDown } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { theme } from './ui/theme';
import { InfoBanner } from './ui/InfoBanner';
import { ActionCard } from './ui/ActionCard';
import ConsentView from './Consent';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

type AuthenticationErrorScreenProps = {
  errorDetails?: string;
};

export function AuthenticationErrorScreen({ errorDetails }: AuthenticationErrorScreenProps) {
  const [isDark, setIsDark] = useState(true);
  const [showConsentView, setShowConsentView] = useState(false);
  const themeStyles = theme(isDark);
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleRetry = () => {
    // Force a page refresh to retry authentication
    window.location.reload();
  };

  const handleSignInAgain = () => {
    // Toggle the ConsentView visibility instead of redirecting
    setShowConsentView(!showConsentView);
  };

  const handleToggleTheme = useCallback(() => {
    setIsDark(!isDark);
  }, [isDark]);

  return (
    <div className={`min-h-screen w-full transition-colors duration-500 ${themeStyles.bg} p-4`}>
      {/* Main Card Container */}
      <div
        className={`max-w-6xl mx-auto ${themeStyles.mainCard} border ${themeStyles.mainCardBorder} rounded-2xl shadow-2xl overflow-hidden`}
      >
        {/* Header */}
        <div className={`px-6 py-4 border-b ${themeStyles.cardBorder}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={isDark ? '/logo-white.svg' : '/logo.svg'}
                alt="Vincent by Lit Protocol"
                className="h-8"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleTheme}
                className={`${themeStyles.text} hover:bg-white/10`}
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-6 py-8 space-y-6">
          {/* Status Banner */}
          <InfoBanner
            theme={themeStyles}
            type="warning"
            title="Authentication Required"
            message="You need to authenticate again to access this page. Please sign in to continue."
          />

          {/* Info Card */}
          <Card
            className={`backdrop-blur-xl ${themeStyles.cardBg} border ${themeStyles.cardBorder}`}
          >
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-500/20 rounded-lg">
                    <ShieldOff className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <h2 className={`text-lg font-semibold ${themeStyles.text}`}>Error!</h2>
                    <p className={`text-sm ${themeStyles.textMuted} mt-1`}>
                      Your session has expired or you need to authenticate to access this content.
                    </p>
                  </div>
                </div>

                {errorDetails && (
                  <div
                    className={`p-4 rounded-lg ${themeStyles.cardBg} border ${themeStyles.cardBorder}`}
                  >
                    <h3 className={`text-sm font-medium ${themeStyles.text} mb-2`}>
                      Error Details
                    </h3>
                    <p className={`text-sm ${themeStyles.textMuted} font-mono`}>{errorDetails}</p>
                  </div>
                )}

                <div
                  className={`p-4 rounded-lg ${themeStyles.cardBg} border ${themeStyles.cardBorder}`}
                >
                  <h3 className={`text-sm font-medium ${themeStyles.text} mb-2`}>
                    Why am I seeing this?
                  </h3>
                  <ul className={`text-sm ${themeStyles.textMuted} space-y-1`}>
                    <li>• Your authentication session may have expired</li>
                    <li>• You may need to sign in with your PKP credentials</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Options Card */}
          <Card
            className={`backdrop-blur-xl ${themeStyles.cardBg} border ${themeStyles.cardBorder}`}
          >
            <CardContent className="p-6">
              <div className="space-y-4">
                <h2 className={`text-lg font-semibold ${themeStyles.text}`}>
                  What would you like to do?
                </h2>

                <div className="space-y-3">
                  {/* Sign In Again Option */}
                  <div className="relative">
                    <ActionCard
                      theme={themeStyles}
                      icon={<LogIn className="w-4 h-4 text-blue-500" />}
                      iconBg="bg-blue-500/20"
                      title="Sign In Again"
                      description="Authenticate with your PKP credentials"
                      onClick={handleSignInAgain}
                      extraContent={
                        <motion.div
                          animate={{ rotate: showConsentView ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="w-4 h-4 text-blue-500" />
                        </motion.div>
                      }
                    />

                    {/* ConsentView with smooth animation */}
                    <AnimatePresence>
                      {showConsentView && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                          className="overflow-hidden"
                        >
                          <div className="pt-4">
                            <ConsentView isUserDashboardFlow={false} theme={themeStyles} />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Retry Option */}
                  <ActionCard
                    theme={themeStyles}
                    icon={<RefreshCw className="w-4 h-4 text-green-500" />}
                    iconBg="bg-green-500/20"
                    title="Try Again"
                    description="Refresh the page to retry authentication"
                    onClick={handleRetry}
                  />

                  {/* Go Back Option */}
                  <ActionCard
                    theme={themeStyles}
                    icon={<ArrowLeft className="w-4 h-4 text-gray-500" />}
                    iconBg="bg-gray-500/20"
                    title="Go Back"
                    description="Return to the previous page"
                    onClick={handleGoBack}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
