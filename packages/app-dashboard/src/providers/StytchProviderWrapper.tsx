import { ReactNode } from 'react';
import { StytchProvider } from '@stytch/nextjs';
import { createStytchUIClient } from '@stytch/nextjs/ui';

import { env } from '@/config/env';

const { VITE_STYTCH_PUBLIC_TOKEN } = env;

const stychtClient = createStytchUIClient(VITE_STYTCH_PUBLIC_TOKEN);

export default function RainbowKitProviderWrapper({
  children,
}: {
  children: ReactNode;
}) {
  return <StytchProvider stytch={stychtClient}>{children}</StytchProvider>;
}
