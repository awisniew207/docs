import { Helmet } from 'react-helmet';
import ConsentView from '@/components/consent/pages/index';
import { wrap } from '@/utils/components';
import { UserProviders } from '@/providers';
import UserLayout from '@/components/layout/UserLayout';

export function Consent() {
  return (
    <>
      <Helmet>
        <title>Vincent | App Consent</title>
        <meta name="description" content="Review and provide consent for an application" />
      </Helmet>
      <ConsentView />
    </>
  );
}

const ConsentPage = wrap(Consent, [...UserProviders, UserLayout]);
export default ConsentPage;
