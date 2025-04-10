import React from 'react';
import { AppView } from '../../types';
import StatusMessage from './StatusMessage';
import { useVersionEnabledCheck } from '../../hooks/useVersionEnabledCheck';
import { IRelayPKP } from '@lit-protocol/types';

interface VersionUpgradePromptProps {
  appInfo: AppView;
  permittedVersion: number;
  agentPKP?: IRelayPKP;
  onUpgrade: () => void;
  onContinue: () => void;
  onUpdateParameters: () => void;
  statusMessage: string;
  statusType: 'info' | 'warning' | 'success' | 'error';
}

const VersionUpgradePrompt = ({
  appInfo,
  permittedVersion,
  agentPKP,
  onUpgrade,
  onContinue,
  onUpdateParameters,
  statusMessage,
  statusType
}: VersionUpgradePromptProps) => {

  const { isVersionEnabled } = useVersionEnabledCheck({
    versionNumber: permittedVersion
  });

  return (
    <div className="consent-form-container">
      <h1>Version Upgrade Available</h1>
      {isVersionEnabled === true && (
        <StatusMessage message={statusMessage} type={statusType} />
      )}

      <div className="alert alert--warning" style={{ display: "block" }}>
        <p style={{ display: "block" }}>
          You already have permission for version {permittedVersion} of this application,
          but version {appInfo.latestVersion.toString()} is now available.
        </p>
      </div>

      {isVersionEnabled === false && (
        <div className="alert alert--warning" style={{
          display: "block",
          marginTop: "12px",
          backgroundColor: "#FFFBE6",
          color: "#806A00"
        }}>
          <p style={{ display: "block" }}>
            <strong>Warning:</strong> Version {permittedVersion} has been disabled by the app developer.
            To continue using the app, please update to the latest version.
          </p>
        </div>
      )}

      <div className="app-info">
        <h2>App Information</h2>
        <div className="app-info-details">
          <p>
            <strong>Name:</strong> {appInfo.name}
          </p>
          <p>
            <strong>Description:</strong> {appInfo.description}
          </p>
          {agentPKP && (
            <p>
              <strong>Account Address:</strong> {agentPKP.ethAddress}
            </p>
          )}
        </div>

        <div className="consent-actions" style={{ marginTop: "20px" }}>
          <button
            className="btn btn--primary"
            onClick={onUpgrade}
          >
            Update to Latest Version
          </button>
          <button
            className="btn btn--secondary"
            onClick={onUpdateParameters}
          >
            Update Parameters Only
          </button>
          <button
            className="btn btn--outline"
            onClick={onContinue}
          >
            Continue Without Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default VersionUpgradePrompt;