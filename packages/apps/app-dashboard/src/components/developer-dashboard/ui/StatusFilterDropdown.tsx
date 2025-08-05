import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';

export type FilterOption = {
  id: string;
  label: string;
};

interface StatusFilterDropdownProps {
  options: FilterOption[];
  selectedOptionId: string;
  onChange: (optionId: string) => void;
  buttonVariant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link';
  buttonClassName?: string;
  dropdownWidth?: string;
}

// TODO use select component
export function StatusFilterDropdown({
  options,
  selectedOptionId,
  onChange,
  buttonVariant = 'outline',
  buttonClassName = 'text-neutral-800 dark:text-white flex items-center gap-2',
  dropdownWidth = 'w-48',
}: StatusFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Find the currently selected option
  const selectedOption = options.find((option) => option.id === selectedOptionId) || options[0];

  return (
    <div className="relative">
      <Button
        variant={buttonVariant}
        className={buttonClassName}
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedOption.label}
        <ChevronDown className="h-4 w-4" />
      </Button>

      {isOpen && (
        <div
          className={`absolute right-0 mt-2 ${dropdownWidth} bg-white dark:bg-neutral-800 rounded-md shadow-lg z-10 border dark:border-white/10`}
        >
          <div className="py-1">
            {options.map((option) => (
              <button
                key={option.id}
                className={`w-full text-left px-4 py-2 text-sm text-neutral-800 dark:text-white ${
                  selectedOptionId === option.id
                    ? 'bg-gray-100 dark:bg-white/10'
                    : 'hover:bg-gray-100 dark:hover:bg-white/10'
                }`}
                onClick={() => {
                  onChange(option.id);
                  setIsOpen(false);
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
