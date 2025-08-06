import { App } from '@/types/developer-dashboard/appTypes';

export function AppHero({ apps }: { apps: App[] }) {
  return (
    <div className="relative group">
      <div className="absolute inset-0 bg-black/5 rounded-2xl blur-xl opacity-0 transition-all duration-700"></div>
      <div className="relative bg-white/40 backdrop-blur-xl border border-black/10 rounded-2xl p-12 hover:border-black/20 transition-all duration-500">
        <div className="flex flex-col items-center text-center">
          <div className="mb-6">
            <div className="inline-flex items-center gap-3 bg-white/40 backdrop-blur-sm border border-black/10 rounded-full px-4 py-2">
              <div className="w-2 h-2 bg-black/5 rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold text-black">
                {apps.length} {apps.length === 1 ? 'Application' : 'Applications'} Available
              </span>
            </div>
          </div>
          <h1 className="text-5xl sm:text-6xl font-light text-black mb-6 leading-tight">
            Automate your
            <br />
            <span className="relative">
              Web3 interactions
              <div className="absolute -bottom-2 left-0 right-0 h-1 bg-black/5 rounded-full opacity-50"></div>
            </span>
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl leading-relaxed">
            Vincent applications work autonomously on your behalf, operating within the guidelines
            you set.
          </p>
        </div>
      </div>
    </div>
  );
}
