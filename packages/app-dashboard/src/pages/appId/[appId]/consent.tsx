// import { Metadata } from 'next';
import ConsentView from '@/components/consent/pages/index';
import { wrap } from '@/utils/components';
import { UserProviders } from '@/providers';
import UserLayout from '@/components/layout/UserLayout';

// export const metadata: Metadata = {
//   title: 'Vincent | App Consent',
//   description: 'Review and provide consent for an application',
// };

export function Consent() {
  return <ConsentView />;
}

const ConsentPage = wrap(Consent, [...UserProviders, UserLayout]);
export default ConsentPage;
