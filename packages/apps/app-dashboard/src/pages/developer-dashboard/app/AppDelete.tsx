import { DeleteAppWrapper } from '@/components/developer-dashboard/app/wrappers/DeleteAppWrapper';
import { useAddressCheck } from '@/hooks/developer-dashboard/app/useAddressCheck';

interface AppDeleteProps {
  app: any;
  refetchApps: () => void;
}

export default function AppDelete({ app, refetchApps }: AppDeleteProps) {
  useAddressCheck(app);

  return <DeleteAppWrapper app={app} refetchApps={refetchApps} />;
}
