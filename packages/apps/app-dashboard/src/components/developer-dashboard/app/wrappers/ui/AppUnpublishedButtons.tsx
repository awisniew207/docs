import { Edit, Plus, Trash2 } from 'lucide-react';

interface AppUnpublishedButtonsProps {
  onOpenMutation: (mutationType: string) => void;
}

export function AppUnpublishedButtons({ onOpenMutation }: AppUnpublishedButtonsProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <button
        onClick={() => onOpenMutation('edit-app')}
        className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg text-sm font-medium text-gray-700 dark:text-white/80 bg-white dark:bg-neutral-800 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
      >
        <Edit className="h-4 w-4" />
        Edit App
      </button>
      <button
        onClick={() => onOpenMutation('create-app-version')}
        className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg text-sm font-medium text-gray-700 dark:text-white/80 bg-white dark:bg-neutral-800 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Create App Version
      </button>
      <button
        onClick={() => onOpenMutation('delete-app')}
        className="inline-flex items-center gap-2 px-4 py-2 border border-red-200 dark:border-red-500/30 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 bg-white dark:bg-neutral-800 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
      >
        <Trash2 className="h-4 w-4" />
        Delete App
      </button>
    </div>
  );
}
