import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/shared/ui/button';
import { theme } from '@/components/user-dashboard/connect/ui/theme';
import { ImageIcon, X } from 'lucide-react';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ViewType = 'main' | 'zerion' | 'uniswap';

export const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose }) => {
  const [currentView, setCurrentView] = useState<ViewType>('main');
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  const renderMainView = () => (
    <>
      {/* Header */}
      <div className={`px-4 sm:px-6 py-4 border-b ${theme.cardBorder}`}>
        <h2 className={`text-lg font-medium ${theme.text} text-center mb-2`}>Connect to dApps</h2>
        <p className={`text-sm ${theme.textMuted} text-center`}>
          Vincent uses WalletConnect to allow secure access to dApps. To{' '}
          <span className="text-orange-500">withdraw funds</span>, please connect to one of the
          dApps below. You can also use any other app of your choosing.
        </p>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-4">
        {/* Verified Apps */}
        <div className="space-y-3">
          <h3 className={`text-sm font-medium ${theme.text}`}>Verified Apps</h3>

          <div className="grid grid-cols-1 gap-3">
            {/* Zerion Card */}
            <div
              className={`p-4 rounded-lg border ${theme.cardBorder} ${theme.cardBg} hover:${theme.itemHoverBg} transition-colors cursor-pointer`}
              onClick={() => setCurrentView('zerion')}
            >
              <div className="flex items-center space-x-3">
                <img src="/external-logos/icons/zerion-icon.svg" alt="Zerion" className="w-8 h-8" />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className={`font-medium ${theme.text} text-sm`}>Zerion</h4>
                    <span className="px-2 py-0.5 text-xs bg-orange-500/10 text-orange-500 rounded-full -mt-0.5">
                      Recommended
                    </span>
                  </div>
                  <p className={`text-xs ${theme.textMuted}`}>
                    Portfolio management and DeFi interface
                  </p>
                </div>
                <svg
                  className={`w-4 h-4 ${theme.textMuted}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>

            {/* Uniswap Card */}
            <div
              className={`p-4 rounded-lg border ${theme.cardBorder} ${theme.cardBg} hover:${theme.itemHoverBg} transition-colors cursor-pointer`}
              onClick={() => setCurrentView('uniswap')}
            >
              <div className="flex items-center space-x-3">
                <img
                  src="/external-logos/icons/uniswap-logo.svg"
                  alt="Uniswap"
                  className="w-8 h-8"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className={`font-medium ${theme.text} text-sm`}>Uniswap</h4>
                    <span className="px-2 py-0.5 text-xs bg-orange-500/10 text-orange-500 rounded-full -mt-0.5">
                      Recommended
                    </span>
                  </div>
                  <p className={`text-xs ${theme.textMuted}`}>Decentralized token exchange</p>
                </div>
                <svg
                  className={`w-4 h-4 ${theme.textMuted}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Other Connections */}
        <div className="space-y-3">
          <h3 className={`text-sm font-medium ${theme.text}`}>Other Connections</h3>

          <div className="grid grid-cols-1 gap-3">
            <div
              className={`p-4 rounded-lg border ${theme.cardBorder} ${theme.cardBg} hover:${theme.itemHoverBg} transition-colors cursor-pointer`}
              onClick={onClose}
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-orange-600 dark:text-orange-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className={`font-medium ${theme.text} text-sm`}>Connect to any dApp</h4>
                  <p className={`text-xs ${theme.textMuted}`}>
                    Use WalletConnect with any supported dApp
                  </p>
                </div>
                <svg
                  className={`w-4 h-4 ${theme.textMuted}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  const renderZerionView = () => (
    <>
      {/* Header */}
      <div className={`px-4 sm:px-6 py-4 border-b ${theme.cardBorder}`}>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setCurrentView('main')}
            className={`p-1 rounded-md hover:${theme.itemHoverBg} transition-colors`}
          >
            <svg
              className={`w-5 h-5 ${theme.text}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <div className="flex items-center space-x-2">
            <img src="/external-logos/icons/zerion-icon.svg" alt="Zerion" className="w-6 h-6" />
            <h2 className={`text-lg font-medium ${theme.text}`}>Connect to Zerion</h2>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-4">
        <div className="space-y-4">
          <p className={`text-sm ${theme.textMuted}`}>
            Follow these steps to connect your Vincent wallet to Zerion:
          </p>

          <div className="space-y-3">
            <div className="flex space-x-3">
              <span className="text-sm font-bold text-orange-500 flex-shrink-0">1.</span>
              <p className={`text-sm ${theme.text}`}>
                Visit{' '}
                <a
                  href="https://app.zerion.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-500 underline"
                >
                  app.zerion.io
                </a>{' '}
                in your browser
              </p>
            </div>

            <div className="flex space-x-3">
              <span className="text-sm font-bold text-orange-500 flex-shrink-0">2.</span>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <p className={`text-sm ${theme.text} flex-1 mr-2`}>
                    Under "Connect to Zerion" &gt; "Ethereum", click "WalletConnect"
                  </p>
                  <button
                    onClick={() => setExpandedImage('/wc-instructions/zerion/zerion-1.png')}
                    className="ml-4 p-1 hover:bg-gray-700 rounded transition-colors flex-shrink-0"
                    aria-label="View screenshot"
                  >
                    <ImageIcon className="w-4 h-4 text-orange-500" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <span className="text-sm font-bold text-orange-500 flex-shrink-0">3.</span>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <p className={`text-sm ${theme.text} flex-1 mr-2`}>
                    Copy the connection URI or scan the QR code from the Vincent page
                  </p>
                  <button
                    onClick={() => setExpandedImage('/wc-instructions/zerion/zerion-2.png')}
                    className="ml-4 p-1 hover:bg-gray-700 rounded transition-colors flex-shrink-0"
                    aria-label="View screenshot"
                  >
                    <ImageIcon className="w-4 h-4 text-orange-500" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <span className="text-sm font-bold text-orange-500 flex-shrink-0">4.</span>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <p className={`text-sm ${theme.text} flex-1 mr-2`}>
                    Approve the connection on the Vincent dashboard
                  </p>
                  <button
                    onClick={() => setExpandedImage('/wc-instructions/zerion/zerion-3.png')}
                    className="ml-4 p-1 hover:bg-gray-700 rounded transition-colors flex-shrink-0"
                    aria-label="View screenshot"
                  >
                    <ImageIcon className="w-4 h-4 text-orange-500" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <span className="text-sm font-bold text-orange-500 flex-shrink-0">5.</span>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <p className={`text-sm ${theme.text} flex-1 mr-2`}>
                    You're connected! You can now use Zerion to manage your Vincent Wallet.
                  </p>
                  <button
                    onClick={() => setExpandedImage('/wc-instructions/zerion/zerion-4.png')}
                    className="ml-4 p-1 hover:bg-gray-700 rounded transition-colors flex-shrink-0"
                    aria-label="View screenshot"
                  >
                    <ImageIcon className="w-4 h-4 text-orange-500" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className={`bg-orange-50/60 dark:bg-orange-900/25 p-4 rounded-lg mt-4`}>
            <p className={`text-xs ${theme.textMuted}`}>
              <strong>Tip:</strong> Once connected, you'll be able to view your portfolio, manage
              assets, and interact with DeFi protocols directly through Zerion using your Vincent
              wallet.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={`px-4 sm:px-6 py-4 border-t ${theme.cardBorder} flex justify-center`}>
        <Button
          variant="outline"
          onClick={onClose}
          className={`px-8 ${theme.text} border ${theme.cardBorder} hover:${theme.itemHoverBg}`}
        >
          Start Connection
        </Button>
      </div>
    </>
  );

  const renderUniswapView = () => (
    <>
      {/* Header */}
      <div className={`px-4 sm:px-6 py-4 border-b ${theme.cardBorder}`}>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setCurrentView('main')}
            className={`p-1 rounded-md hover:${theme.itemHoverBg} transition-colors`}
          >
            <svg
              className={`w-5 h-5 ${theme.text}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <div className="flex items-center space-x-2">
            <img src="/external-logos/icons/uniswap-logo.svg" alt="Uniswap" className="w-6 h-6" />
            <h2 className={`text-lg font-medium ${theme.text}`}>Connect to Uniswap</h2>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-4">
        <div className="space-y-4">
          <p className={`text-sm ${theme.textMuted}`}>
            Follow these steps to connect your Vincent wallet to Uniswap:
          </p>

          <div className="space-y-3">
            <div className="flex space-x-3">
              <span className="text-sm font-bold text-orange-500 flex-shrink-0">1.</span>
              <p className={`text-sm ${theme.text}`}>
                Visit{' '}
                <a
                  href="https://app.uniswap.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-500 underline"
                >
                  app.uniswap.org
                </a>{' '}
                in your browser
              </p>
            </div>

            <div className="flex space-x-3">
              <span className="text-sm font-bold text-orange-500 flex-shrink-0">2.</span>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <p className={`text-sm ${theme.text} flex-1 mr-2`}>
                    Click "Connect" in the top right and select "WalletConnect"
                  </p>
                  <button
                    onClick={() => setExpandedImage('/wc-instructions/uniswap/uniswap-1.png')}
                    className="ml-4 p-1 hover:bg-gray-700 rounded transition-colors flex-shrink-0"
                    aria-label="View screenshot"
                  >
                    <ImageIcon className="w-4 h-4 text-orange-500" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <span className="text-sm font-bold text-orange-500 flex-shrink-0">3.</span>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <p className={`text-sm ${theme.text} flex-1 mr-2`}>
                    Copy the connection URI or scan the QR code from the Vincent page
                  </p>
                  <button
                    onClick={() => setExpandedImage('/wc-instructions/uniswap/uniswap-2.png')}
                    className="ml-2 p-1 hover:bg-gray-700 rounded transition-colors"
                    aria-label="View screenshot"
                  >
                    <ImageIcon className="w-4 h-4 text-orange-500" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <span className="text-sm font-bold text-orange-500 flex-shrink-0">4.</span>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <p className={`text-sm ${theme.text} flex-1 mr-2`}>
                    Approve the connection on the Vincent dashboard
                  </p>
                  <button
                    onClick={() => setExpandedImage('/wc-instructions/uniswap/uniswap-3.png')}
                    className="ml-2 p-1 hover:bg-gray-700 rounded transition-colors"
                    aria-label="View screenshot"
                  >
                    <ImageIcon className="w-4 h-4 text-orange-500" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <span className="text-sm font-bold text-orange-500 flex-shrink-0">5.</span>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <p className={`text-sm ${theme.text} flex-1 mr-2`}>
                    You're connected! You can now trade on Uniswap with your Vincent Wallet.
                  </p>
                  <button
                    onClick={() => setExpandedImage('/wc-instructions/uniswap/uniswap-4.png')}
                    className="ml-4 p-1 hover:bg-gray-700 rounded transition-colors flex-shrink-0"
                    aria-label="View screenshot"
                  >
                    <ImageIcon className="w-4 h-4 text-orange-500" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className={`bg-orange-50/60 dark:bg-orange-900/25 p-4 rounded-lg mt-4`}>
            <p className={`text-xs ${theme.textMuted}`}>
              <strong>Tip:</strong> Once connected, you'll be able to swap tokens, provide
              liquidity, and access all Uniswap features using your Vincent wallet.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={`px-4 sm:px-6 py-4 border-t ${theme.cardBorder} flex justify-center`}>
        <Button
          variant="outline"
          onClick={onClose}
          className={`px-8 ${theme.text} border ${theme.cardBorder} hover:${theme.itemHoverBg}`}
        >
          Start Connection
        </Button>
      </div>
    </>
  );

  const renderCurrentView = () => {
    switch (currentView) {
      case 'zerion':
        return renderZerionView();
      case 'uniswap':
        return renderUniswapView();
      default:
        return renderMainView();
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={onClose}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 30,
              }}
              className="fixed inset-0 flex items-center justify-center p-4 z-50 pointer-events-none md:pl-64"
            >
              <div
                className={`w-full max-w-md mx-auto ${theme.mainCard} border ${theme.mainCardBorder} rounded-2xl shadow-2xl overflow-hidden pointer-events-auto`}
                onClick={(e) => e.stopPropagation()}
              >
                {renderCurrentView()}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Image Modal */}
      <AnimatePresence>
        {expandedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80"
            onClick={() => setExpandedImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-[95vw] max-h-[90vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setExpandedImage(null)}
                className="absolute top-4 right-4 p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors z-10"
                aria-label="Close image"
              >
                <X className="w-4 h-4 text-white" />
              </button>
              <img src={expandedImage} alt="Screenshot" className="rounded-lg shadow-2xl" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
