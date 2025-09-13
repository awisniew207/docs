import { Skeleton } from '@/components/shared/ui/skeleton';
import { theme } from '@/components/user-dashboard/connect/ui/theme';

export function WithdrawFormSkeleton() {
  return (
    <div className="max-w-xl w-full mx-auto">
      <div
        className={`${theme.mainCard} rounded-2xl shadow-sm border ${theme.mainCardBorder} overflow-hidden`}
      >
        {/* Header */}
        <div className={`px-6 py-4 border-b ${theme.cardBorder}`}>
          <div className="flex items-center justify-center relative">
            <Skeleton className="h-6 w-28" />
          </div>
        </div>

        <div className="px-6 py-6 space-y-6">
          {/* Wallet Address Section */}
          <div>
            <Skeleton className="h-3 w-40 mb-2" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 flex-1" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>

          {/* Wallet Status Section */}
          <div>
            <Skeleton className="h-4 w-24 mb-3" />

            {/* Status Message */}
            <Skeleton className="h-10 w-full mb-4" />

            {/* QR Scanner Button */}
            <Skeleton className="h-12 w-full mb-4" />

            {/* OR Divider */}
            <div className="flex items-center my-4">
              <div className={`flex-1 border-t ${theme.cardBorder}`}></div>
              <span className={`px-3 text-sm ${theme.textMuted}`}>OR</span>
              <div className={`flex-1 border-t ${theme.cardBorder}`}></div>
            </div>

            {/* URI Input */}
            <div className="flex w-full mb-4">
              <Skeleton className="h-10 flex-1 rounded-r-none" />
              <Skeleton className="h-10 w-20 rounded-l-none" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
