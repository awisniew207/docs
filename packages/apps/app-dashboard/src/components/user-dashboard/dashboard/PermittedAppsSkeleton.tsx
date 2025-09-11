import { theme } from '@/components/user-dashboard/connect/ui/theme';
import { Card, CardContent } from '@/components/shared/ui/card';

export function PermittedAppsSkeleton() {
  // Generate 6 skeleton cards to fill the grid nicely
  const skeletonCards = Array.from({ length: 6 }, (_, i) => i);

  return (
    <div className="w-full flex justify-start px-3 sm:px-6 pt-6">
      <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {skeletonCards.map((index) => (
          <Card
            key={index}
            className={`py-0 gap-0 backdrop-blur-xl ${theme.cardBg} border ${theme.cardBorder}`}
            style={{ height: '160px' }}
          >
            <CardContent className="p-3 relative">
              {/* Version Badge - Absolutely positioned */}
              <div className="absolute top-2 right-2 h-5 w-8 rounded bg-orange-200 dark:bg-orange-800 animate-pulse"></div>

              <div className="flex flex-col gap-2">
                {/* Logo and Title Row */}
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <div className={`w-10 h-10 rounded-lg ${theme.itemBg} animate-pulse`}></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`h-4 rounded ${theme.itemBg} animate-pulse`}></div>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <div className={`h-3 rounded ${theme.itemBg} animate-pulse`}></div>
                  <div className={`h-3 rounded ${theme.itemBg} animate-pulse`}></div>
                  <div className={`h-3 rounded ${theme.itemBg} animate-pulse w-3/4`}></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
