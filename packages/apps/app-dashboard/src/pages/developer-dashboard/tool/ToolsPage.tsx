import { useNavigate } from 'react-router';
import { ToolsList } from '@/components/developer-dashboard/ui/ResourceLists';
import { Tool } from '@/types/developer-dashboard/appTypes';

export default function AppsPage() {
  const navigate = useNavigate();

  return (
    <ToolsList
      onCreateClick={() => navigate('/developer/create-tool')}
      onToolClick={(tool: Tool) => navigate(`/developer/toolId/${tool.title}`)}
    />
  );
}
