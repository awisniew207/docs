import { ChevronDown, ChevronUp, Wrench } from 'lucide-react';
import { AppVersionAbility, Ability } from '@/types/developer-dashboard/appTypes';
import { AbilityVersionPoliciesWrapper } from '../wrappers/ui/AbilityVersionPolicyWrapper';
import { Logo } from '@/components/shared/ui/Logo';
import { useState } from 'react';

interface AbilityInfoViewProps {
  appVersionAbility: AppVersionAbility;
  ability: Ability;
}

export function AbilityInfoView({ appVersionAbility, ability }: AbilityInfoViewProps) {
  const [expandedAbility, setExpandedAbility] = useState<string | null>(null);

  const handleAbilityClick = (abilityPackageName: string) => {
    setExpandedAbility(expandedAbility === abilityPackageName ? null : abilityPackageName);
  };

  return (
    <div key={ability.packageName} className="space-y-3">
      {/* Clickable Ability Card */}
      <div
        className="group/ability p-5 rounded-xl bg-black/[0.02] border border-black/5 hover:border-black/10 cursor-pointer transition-all duration-300"
        onClick={() => handleAbilityClick(ability.packageName)}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-black/5 border border-black/5 group-hover/ability:border-black/10 transition-all duration-300 flex items-center justify-center overflow-hidden">
              {ability.logo ? (
                <Logo
                  logo={ability.logo}
                  alt={`${ability.title || ability.packageName} logo`}
                  className="w-full h-full object-contain"
                />
              ) : (
                <Wrench className="w-4 h-4 text-black/40" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-base font-light text-black/90">
                {ability.title || ability.packageName}
              </p>
              <a
                href={`https://www.npmjs.com/package/${ability.packageName}/v/${ability.activeVersion}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-75 transition-opacity"
                title={`View ${ability.packageName} v${ability.activeVersion} on npm`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <img src="/npm.png" alt="npm" className="w-full h-full object-contain" />
                </div>
              </a>
              {ability.description && (
                <p className="text-sm text-gray-600 mt-1 leading-relaxed">{ability.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {appVersionAbility.hiddenSupportedPolicies &&
              appVersionAbility.hiddenSupportedPolicies.length > 0 && (
                <span className="px-3 py-1 bg-black/5 text-black/60 text-xs rounded-full border border-black/10">
                  {appVersionAbility.hiddenSupportedPolicies.length} Hidden Policies
                </span>
              )}
            <span className="text-xs text-black/70 hover:text-black bg-black/5 hover:bg-black/10 font-medium flex items-center gap-1 transition-all duration-300 px-2 py-1 rounded-md">
              {expandedAbility === appVersionAbility.abilityPackageName ? (
                <>
                  Hide policies <ChevronUp className="w-3 h-3" />
                </>
              ) : (
                <>
                  Show policies <ChevronDown className="w-3 h-3" />
                </>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Ability Policies - Show below the ability card when expanded */}
      {expandedAbility === appVersionAbility.abilityPackageName && (
        <div className="ml-4 pl-4 border-l-2 !border-orange-500/50 animate-fadeIn">
          {appVersionAbility.abilityVersion ? (
            <AbilityVersionPoliciesWrapper appAbilityVersion={appVersionAbility} />
          ) : (
            <p className="text-sm text-gray-600">
              No policy information available for this ability.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
