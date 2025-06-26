import ErrorPopupProvider from '@/providers/ErrorPopup';
import RainbowKitProviderWrapper from '@/providers/RainbowKitProviderWrapper';
import StytchProviderWrapper from '@/providers/StytchProviderWrapper';
import WagmiProviderWrapper from '@/providers/WagmiProviderWrapper';
import ReduxProvider from '@/providers/ReduxProvider';
import { DeveloperDataProvider } from '@/contexts/DeveloperDataContext';

export const AppProviders = [
  ReduxProvider,
  WagmiProviderWrapper,
  RainbowKitProviderWrapper,
  DeveloperDataProvider,
  ErrorPopupProvider,
];

export const UserProviders = [StytchProviderWrapper, ErrorPopupProvider];
