import { AlertTriangle } from 'lucide-react';
import { Header } from './Header';

interface ExplorerErrorPageProps {
  title: string;
  message: string;
  showBackButton?: boolean;
}

export const ExplorerErrorPage = ({
  title,
  message,
  showBackButton = false,
}: ExplorerErrorPageProps) => {
  return (
    <div className="fixed inset-0 bg-white overflow-auto">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Navigation Header */}
        <Header showBackButton={showBackButton} />

        {/* Error Content */}
        <div className="relative bg-white/40 backdrop-blur-xl border border-black/10 rounded-2xl p-12">
          <div className="flex flex-col items-center justify-center text-center min-h-[300px]">
            <div className="mb-6">
              <AlertTriangle className="h-16 w-16 text-red-500 mx-auto" />
            </div>

            <h2 className="text-2xl font-semibold text-gray-900 mb-3">{title}</h2>

            <p className="text-gray-600 max-w-md">{message}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
