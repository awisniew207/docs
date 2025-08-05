import { Code, TrendingUp, Wrench, Shield, Layers, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router';

interface HeaderProps {
  showBackButton?: boolean;
}

export function Header({ showBackButton = false }: HeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="relative group">
      <div className="absolute inset-0 bg-black/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-700"></div>
      <div className="relative bg-white/40 backdrop-blur-xl border border-black/10 rounded-2xl p-2 hover:border-black/20 transition-all duration-500">
        <div className="flex items-center justify-between">
          {/* Left side: Navigation */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Back Button (conditional) */}
            {showBackButton && (
              <button
                onClick={() => navigate('/explorer/apps')}
                className="group flex items-center gap-2 text-gray-600 hover:text-black bg-transparent hover:bg-black/5 border border-black/10 hover:border-black/20 transition-all duration-300 rounded-full px-3 py-1.5 text-sm font-medium"
              >
                <ArrowLeft className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1" />
                <span className="hidden lg:inline">Back</span>
              </button>
            )}

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/explorer/apps')}
                className={`group/tab flex items-center gap-1 sm:gap-2 ${showBackButton ? 'px-2 sm:px-4' : 'px-4'} py-2 rounded-xl text-white bg-black/90 font-medium text-xs sm:text-sm transition-all duration-300 hover:scale-105`}
              >
                <Layers className="w-4 h-4" />
                <span className={showBackButton ? 'hidden sm:inline' : ''}>Apps</span>
              </button>

              <button
                disabled
                className={`group/tab relative flex items-center gap-1 sm:gap-2 ${showBackButton ? 'px-2 sm:px-4' : 'px-4'} py-2 rounded-xl text-black/40 opacity-60 cursor-not-allowed font-medium text-xs sm:text-sm`}
              >
                <Wrench className="w-4 h-4" />
                <span className={showBackButton ? 'hidden sm:inline' : ''}>Abilities</span>
                <div className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs font-semibold px-1.5 py-0.5 rounded-md">
                  <span className={showBackButton ? 'hidden lg:inline' : 'hidden sm:inline'}>
                    Coming Soon
                  </span>
                  <span className={showBackButton ? 'sm:hidden lg:hidden' : 'sm:hidden'}>Soon</span>
                </div>
              </button>

              <button
                disabled
                className={`group/tab relative flex items-center gap-1 sm:gap-2 ${showBackButton ? 'px-2 sm:px-4' : 'px-4'} py-2 rounded-xl text-black/40 opacity-60 cursor-not-allowed font-medium text-xs sm:text-sm`}
              >
                <Shield className="w-4 h-4" />
                <span className={showBackButton ? 'hidden sm:inline' : ''}>Policies</span>
                <div className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs font-semibold px-1.5 py-0.5 rounded-md">
                  <span className={showBackButton ? 'hidden lg:inline' : 'hidden sm:inline'}>
                    Coming Soon
                  </span>
                  <span className={showBackButton ? 'sm:hidden lg:hidden' : 'sm:hidden'}>Soon</span>
                </div>
              </button>
            </div>
          </div>

          {/* Right side: Quick Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => navigate('/user/apps')}
              className={`group/action flex items-center gap-1 sm:gap-2 ${showBackButton ? 'px-1.5 sm:px-4' : 'px-2 sm:px-4'} py-2 rounded-xl bg-black text-white hover:bg-black/90 font-medium text-xs sm:text-sm transition-all duration-300 hover:scale-105`}
            >
              <TrendingUp className="w-4 h-4" />
              <span className={showBackButton ? 'hidden sm:inline' : ''}>Earn</span>
            </button>

            <button
              onClick={() => navigate('/developer/dashboard')}
              className={`group/action flex items-center gap-1 sm:gap-2 ${showBackButton ? 'px-1.5 sm:px-4' : 'px-2 sm:px-4'} py-2 rounded-xl bg-black text-white hover:bg-black/90 font-medium text-xs sm:text-sm transition-all duration-300 hover:scale-105`}
            >
              <Code className="w-4 h-4" />
              <span className={showBackButton ? 'hidden sm:inline' : ''}>Build</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Header;
