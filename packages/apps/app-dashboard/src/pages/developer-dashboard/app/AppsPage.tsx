import { useNavigate } from 'react-router';
import { AppsList } from '@/components/developer-dashboard/ui/ResourceLists';
import { App } from '@/contexts/DeveloperDataContext';

interface AppsPageProps {
  apps: App[];
}

export default function AppsPage({ apps }: AppsPageProps) {
  const navigate = useNavigate();

  return (
    <AppsList
      apps={apps}
      onCreateClick={() => navigate('/developer/create-app')}
      onAppClick={(app: any) => navigate(`/developer/appId/${app.appId}`)}
    />
  );
}
