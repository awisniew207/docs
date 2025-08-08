export interface CountryCode {
  code: string;
  flag: string;
  name: string;
}

// Supported country codes list (USA and Canada only)
export const countryCodes: CountryCode[] = [
  { code: '+1', flag: '🇺🇸', name: 'United States' },
  { code: '+1', flag: '🇨🇦', name: 'Canada' },
];
