import { AppVersionAbility } from '@/types/developer-dashboard/appTypes';

interface AppVersionAbilitiesDisplayProps {
  abilities: AppVersionAbility[];
}

export function AppVersionAbilitiesDisplay({ abilities }: AppVersionAbilitiesDisplayProps) {
  // Filter out deleted abilities
  const activeAbilities = abilities.filter((ability) => !ability.isDeleted);

  if (activeAbilities.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 dark:text-gray-500 text-lg mb-2">📦</div>
        <p className="text-gray-600 dark:text-gray-400">
          No abilities assigned to this app version yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activeAbilities.map((ability: AppVersionAbility) => (
        <div
          key={ability.abilityPackageName}
          className="p-4 bg-gray-50 dark:bg-neutral-800 rounded-lg border dark:border-neutral-700"
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="font-medium text-neutral-800 dark:text-neutral-200">
                {ability.abilityPackageName}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Version: {ability.abilityVersion}
              </div>
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500">
              Added: {new Date(ability.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
