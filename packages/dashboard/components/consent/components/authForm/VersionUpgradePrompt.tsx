import React from 'react';
import { AppView } from '../../types';
import { IRelayPKP } from '@lit-protocol/types';
import StatusMessage from './StatusMessage';

interface VersionUpgradePromptProps {
  appInfo: AppView;
  permittedVersion: number;
  agentPKP?: IRelayPKP;
  onUpgrade: () => void;
  onContinue: () => void;
  statusMessage: string;
  statusType: 'info' | 'warning' | 'success' | 'error';
}

const VersionUpgradePrompt = ({
  appInfo,
  permittedVersion,
  agentPKP,
  onUpgrade,
  onContinue,
  statusMessage,
  statusType
}: VersionUpgradePromptProps) => {
  return (
    <div className="consent-form-container">
      <h1>Version Upgrade Available</h1>
      <StatusMessage message={statusMessage} type={statusType} />
      
      <div className="alert alert--warning" style={{display: "block"}}>
        <p style={{display: "block"}}>
          You already have permission for version {permittedVersion} of this application, 
          but version {appInfo.latestVersion.toString()} is now available.
        </p>
      </div>
      
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
              <strong>PKP Address:</strong> {agentPKP.ethAddress}
            </p>
          )}
        </div>
        
        <div className="consent-actions" style={{marginTop: "20px"}}>
          <button
            className="btn btn--primary"
            onClick={onUpgrade}
          >
            Update to Latest Version
          </button>
          <button
            className="btn btn--outline"
            onClick={onContinue}
          >
            Continue with Existing Permission
          </button>
        </div>
      </div>
    </div>
  );
};

export default VersionUpgradePrompt; 