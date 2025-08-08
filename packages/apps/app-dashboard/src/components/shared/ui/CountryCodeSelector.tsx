import { useState, useRef, useEffect } from 'react';
import { countryCodes, CountryCode } from '@/utils/user-dashboard/countryCodes';
import { ThemeType } from '../../user-dashboard/connect/ui/theme';

interface CountryCodeSelectorProps {
  selectedCountryCode: string;
  onCountryCodeChange: (countryCode: string) => void;
  theme: ThemeType;
  disabled?: boolean;
}

export default function CountryCodeSelector({
  selectedCountryCode,
  onCountryCodeChange,
  theme,
  disabled = false,
}: CountryCodeSelectorProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleDropdown = () => {
    if (disabled) return;

    if (!isDropdownOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
      });
    }
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleCountrySelect = (country: CountryCode) => {
    onCountryCodeChange(country.code);
    setIsDropdownOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggleDropdown}
        disabled={disabled}
        className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${theme.cardBg} ${theme.cardBorder} ${theme.text} flex items-center justify-between min-w-[140px] ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span>
          {countryCodes.find((c) => c.code === selectedCountryCode)?.flag} {selectedCountryCode}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isDropdownOpen && (
        <div
          className={`fixed max-h-60 overflow-y-auto border rounded-lg shadow-lg z-[9999] ${theme.cardBg} ${theme.cardBorder} min-w-[240px] bg-opacity-95 backdrop-blur-sm`}
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            scrollbarWidth: 'thin',
            scrollbarColor: '#cbd5e1 transparent',
          }}
        >
          {countryCodes.map((country, index) => (
            <button
              key={`${country.code}-${index}`}
              type="button"
              onClick={() => handleCountrySelect(country)}
              className={`w-full px-3 py-1.5 text-left hover:${theme.itemHoverBg} ${theme.text} flex items-center gap-2 transition-colors text-sm`}
            >
              <span className="text-sm">{country.flag}</span>
              <span className="text-sm">{country.code}</span>
              <span className={`text-xs ${theme.textMuted}`}>({country.name})</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
