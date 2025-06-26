import { AppOverviewWrapper } from '@/components/developer-dashboard/app/wrappers/AppOverviewWrapper';

interface AppOverviewProps {
  app: any;
}

export default function AppOverview({ app }: AppOverviewProps) {
  return <AppOverviewWrapper app={app} />;
}
