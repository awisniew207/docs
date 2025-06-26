import { EditAppWrapper } from '@/components/developer-dashboard/app/wrappers/EditAppWrapper';

interface AppEditProps {
  app: any;
  refetchApps: () => void;
}

export default function AppEdit({ app, refetchApps }: AppEditProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">Edit App</h1>
          <p className="text-gray-600 mt-2">Update your application settings and configuration</p>
        </div>
      </div>

      <EditAppWrapper app={app} refetchApps={refetchApps} />
    </div>
  );
}
