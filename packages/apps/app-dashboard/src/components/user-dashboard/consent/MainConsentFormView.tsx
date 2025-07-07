import React from 'react';
import { ContractVersionResult, VersionParameter } from '@/types';  
import StatusMessage from './StatusMessage';

type StatusType = 'info' | 'warning' | 'success' | 'error' | undefined;

interface MainConsentFormViewProps {
  versionInfo: ContractVersionResult | null;
  permittedVersion: number | null;
  existingParameters: VersionParameter[];
  statusMessage: string;
  statusType: StatusType;
  submitting: boolean;
  useCurrentVersionOnly: boolean;
}

/**
 * The main consent form view component
 */
export const MainConsentFormView: React.FC<MainConsentFormViewProps> = ({
  versionInfo,
  statusMessage,
  statusType,
}) => {
  return (
    <>
      {statusMessage && <StatusMessage message={statusMessage} type={statusType} />}

      {versionInfo && (
        <div>
          <h1>Version Parameters Form</h1>
        </div>
      )}

      <div className="text-xs text-gray-500 mb-6 bg-gray-50 p-3 rounded-lg">
        You can change your parameters anytime by revisiting this page.
      </div>

      <div>
        <h1>Consent Actions</h1>
      </div>
    </>
  );
};

export default MainConsentFormView;
