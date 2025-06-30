import { useNavigate } from 'react-router';
import { ToolsList } from '@/components/developer-dashboard/ui/ResourceLists';
import { Tool } from '@/types/developer-dashboard/appTypes';

export default function ToolsPage() {
  const navigate = useNavigate();

  return (
    <ToolsList
      onCreateClick={() => navigate('/developer/create-tool')}
      onToolClick={(tool: Tool) =>
        navigate(`/developer/toolId/${encodeURIComponent(tool.packageName)}`)
      }
    />
  );
}
