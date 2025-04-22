import { Button } from '@/components/ui/button';
import { useVersionEnabledCheck } from '../../hooks/useVersionEnabledCheck';

interface ParameterUpdateModalProps {
  isOpen: boolean;
  onContinue: () => void;
  onUpdate: () => void;
  appName: string;
  permittedVersion: number;
}

const ParameterUpdateModal = ({
  isOpen,
  onContinue,
  onUpdate,
  appName,
  permittedVersion
}: ParameterUpdateModalProps) => {
  const { isVersionEnabled } = useVersionEnabledCheck({
    versionNumber: permittedVersion
  });

  if (!isOpen) return null;

  return (
    <div className="mt-6">
      <div className="bg-gray-50 p-4 rounded-md border border-gray-100 mb-6">
        <p className="text-sm text-gray-700 mb-2">
          You already have permission for version <span className="font-medium">{permittedVersion}</span> of <span className="font-medium">{appName}</span>.
        </p>
      </div>

      {isVersionEnabled === false && (
        <div className="bg-blue-50 border border-blue-100 rounded-md p-4 mb-6">
          <p className="text-sm text-gray-700">
            <span className="font-medium">Notice:</span> Version {permittedVersion} has been disabled by the app developer.
            Please contact the application developer for more information or try using a different application.
          </p>
        </div>
      )}

      <div className="flex flex-col space-y-3">
        <Button
          variant='outline'
          onClick={onUpdate}
          disabled={isVersionEnabled === false}
          title={isVersionEnabled === false ? "This version is disabled and cannot be updated" : "Update policies for this version"}
        >
          Update Policies
        </Button>
        <Button
          onClick={onContinue}
        >
          Continue with Existing Policies
        </Button>
      </div>
    </div>
  );
};

export default ParameterUpdateModal;
