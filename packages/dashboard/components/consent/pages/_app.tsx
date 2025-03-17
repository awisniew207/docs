import { AppProps } from 'next/app';
import '../styles/globals.css';
import { StytchProvider } from '@stytch/nextjs';
import { createStytchUIClient } from '@stytch/nextjs/ui';
import { Albert_Sans } from 'next/font/google';
import SessionValidator from '../components/SessionValidator';

const stytch = createStytchUIClient(
  process.env.NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN || ''
)

const font = Albert_Sans({ subsets: ['latin'] });

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <StytchProvider stytch={stytch}>
        <main className={font.className}>
          <SessionValidator />
          <Component {...pageProps} />
        </main>
    </StytchProvider>
  );
}
