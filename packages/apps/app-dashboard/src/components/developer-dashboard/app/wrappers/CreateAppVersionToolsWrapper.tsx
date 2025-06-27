import { useState } from 'react';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { CreateAppVersionToolsForm } from '../forms/CreateAppVersionToolsForm';
import { Tool } from '@/contexts/DeveloperDataContext';

interface CreateAppVersionToolsWrapperProps {
  versionId: number;
  existingTools: string[];
  onToolAdd: (tool: Tool) => Promise<void>;
  availableTools: Tool[];
}

export function CreateAppVersionToolsWrapper({
  versionId,
  existingTools,
  onToolAdd,
  availableTools,
}: CreateAppVersionToolsWrapperProps) {
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ message: string } | null>(null);

  const handleToolAdd = async (tool: Tool) => {
    setError(null);
    setResult(null);

    try {
      await onToolAdd(tool);

      setResult({
        message: `Successfully added ${tool.packageName} to app version ${versionId}`,
      });

      // Clear result after a delay
      setTimeout(() => setResult(null), 2000);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Failed to add tool to app version');
    }
  };

  if (error) return <StatusMessage message={error} type="error" />;
  if (result) return <StatusMessage message={result.message} type="success" />;

  return (
    <CreateAppVersionToolsForm
      versionId={versionId}
      onToolAdd={handleToolAdd}
      existingTools={existingTools}
      availableTools={availableTools}
    />
  );
}
