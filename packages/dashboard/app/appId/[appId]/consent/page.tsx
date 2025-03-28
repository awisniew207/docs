import { Metadata } from 'next';
import ConsentView from '../../../../components/consent/pages/index';

export const metadata: Metadata = {
  title: 'Vincent | App Consent',
  description: 'Review and provide consent for an application',
};

export default function ConsentPage() {
  return <ConsentView />;
} 