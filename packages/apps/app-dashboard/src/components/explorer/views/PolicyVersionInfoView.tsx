import { Policy } from '@/types/developer-dashboard/appTypes';
import { Shield } from 'lucide-react';
import { Logo } from '@/components/shared/ui/Logo';

interface PolicyVersionInfoViewProps {
  policy: Policy;
}

export function PolicyVersionInfoView({ policy }: PolicyVersionInfoViewProps) {
  return (
    <div className="group relative">
      <div className="absolute inset-0 bg-black/5 rounded-xl blur-xl opacity-0 transition-opacity duration-700"></div>
      <div className="relative p-5 rounded-xl bg-black/[0.02] border border-black/5 hover:border-black/10 transition-all duration-300">
        <div className="flex items-center gap-4 mb-3">
          <div className="w-10 h-10 rounded-lg bg-black/5 border border-black/5 hover:border-black/10 transition-all duration-300 flex items-center justify-center overflow-hidden">
            {policy.logo ? (
              <Logo
                logo={policy.logo}
                alt={`${policy.title} logo`}
                className="w-full h-full object-contain"
              />
            ) : (
              <Shield className="w-4 h-4 text-black/40" />
            )}
          </div>
          <div className="flex-1">
            <p className="text-base font-light text-black/90">{policy.title}</p>
            <a
              href={`https://www.npmjs.com/package/${policy.packageName}/v/${policy.activeVersion}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-75 transition-opacity inline-block"
              title={`View ${policy.packageName} v${policy.activeVersion} on npm`}
            >
              <div className="w-5 h-5 flex items-center justify-center">
                <img src="/npm.png" alt="npm" className="w-full h-full object-contain" />
              </div>
            </a>
          </div>
        </div>

        <p className="text-sm text-gray-600 leading-relaxed mb-3">{policy.description}</p>
      </div>
    </div>
  );
}
