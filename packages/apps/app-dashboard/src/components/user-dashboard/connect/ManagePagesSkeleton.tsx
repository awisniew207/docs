import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { theme } from './ui/theme';
import { isDarkMode } from '@/lib/theme';

export function ManagePagesSkeleton() {
  const isDark = isDarkMode();

  return (
    <SkeletonTheme
      baseColor={isDark ? '#404040' : '#f3f4f6'}
      highlightColor={isDark ? '#737373' : '#e5e7eb'}
    >
      {/* Main Card Container - Same dimensions as AuthConnectScreenSkeleton */}
      <div
        className={`w-full max-w-md mx-auto ${theme.mainCard} border ${theme.mainCardBorder} rounded-2xl shadow-2xl overflow-hidden relative z-10 origin-center`}
      >
        {/* PageHeader Skeleton - icon + title + description */}
        <div className={`px-3 sm:px-4 py-3 border-b ${theme.cardBorder}`}>
          <div className="flex items-center gap-3">
            <Skeleton circle width={40} height={40} className="flex-shrink-0" />
            <div className="flex-1">
              <Skeleton height={16} className="mb-1" style={{ width: '70%' }} />
              <Skeleton height={12} style={{ width: '90%' }} />
            </div>
          </div>
        </div>

        <div className="px-3 sm:px-4 py-6 sm:py-8 space-y-6">
          {/* App Header Skeleton - Same style as AuthConnectScreenSkeleton */}
          <div className="rounded-xl p-2 sm:p-3">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Skeleton
                width={56}
                height={56}
                className="sm:w-18 sm:h-18 rounded-2xl flex-shrink-0"
              />
              <div className="flex-1 text-center sm:text-left">
                <Skeleton height={24} width={150} className="mb-1" />
                <Skeleton height={16} width={200} />
              </div>
            </div>
          </div>

          {/* Dividing line - Same as AuthConnectScreenSkeleton */}
          <div className={`border-b ${theme.cardBorder}`}></div>

          {/* Permission Cards - Similar dimensions to auth method cards */}
          <div className="space-y-3">
            <div className="flex flex-col items-center space-y-3">
              {/* Permission card 1 - Same dimensions as auth method cards */}
              <div
                className={`w-full sm:w-3/4 md:w-3/4 lg:w-full py-3 px-4 flex items-center justify-between ${theme.cardBg} border ${theme.cardBorder} rounded-lg`}
              >
                <div className="flex items-center">
                  <Skeleton circle width={20} height={20} className="mr-3 flex-shrink-0" />
                  <div className="flex-1">
                    <Skeleton height={14} width={120} />
                    <Skeleton height={12} width={180} style={{ marginTop: 2 }} />
                  </div>
                </div>
                <Skeleton width={16} height={16} />
              </div>

              {/* Permission card 2 */}
              <div
                className={`w-full sm:w-3/4 md:w-3/4 lg:w-full py-3 px-4 flex items-center justify-between ${theme.cardBg} border ${theme.cardBorder} rounded-lg`}
              >
                <div className="flex items-center">
                  <Skeleton circle width={20} height={20} className="mr-3 flex-shrink-0" />
                  <div className="flex-1">
                    <Skeleton height={14} width={100} />
                    <Skeleton height={12} width={160} style={{ marginTop: 2 }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trust Warning Text */}
          <div className="flex justify-center text-center">
            <div className="w-full max-w-xs">
              <Skeleton height={14} className="mb-1" style={{ width: '90%' }} />
              <Skeleton height={14} style={{ width: '100%' }} />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
            <div className="w-full sm:w-auto">
              <Skeleton height={40} style={{ width: '100%', minWidth: '120px' }} />
            </div>
            <div className="w-full sm:w-auto">
              <Skeleton height={40} style={{ width: '100%', minWidth: '140px' }} />
            </div>
          </div>
        </div>
      </div>
    </SkeletonTheme>
  );
}
