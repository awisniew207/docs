import React from 'react';
import { AppView, ContractVersionResult } from '../../types';
import { checkForDuplicates } from '../../utils/hasDuplicates';
import { IRelayPKP } from '@lit-protocol/types';

interface AppInfoProps {
  appInfo: AppView;
  agentPKP?: IRelayPKP;
  versionInfo?: ContractVersionResult;
  showIPFSDetails?: boolean;
}

const AppInfo = ({
  appInfo,
  agentPKP,
  versionInfo,
  showIPFSDetails = true
}: AppInfoProps) => {
  const duplicateInfo = checkForDuplicates(versionInfo);
  const hasDuplicates = duplicateInfo.hasDuplicates;

  return (
    <div className='app-info'>
      <h2>App Information</h2>
      <div className='app-info-details'>
        <p>
          <strong>Name:</strong> {appInfo.name}
        </p>
        <p>
          <strong>Description:</strong> {appInfo.description}
        </p>
        <p>
          <strong>Version:</strong>{' '}
          {appInfo.latestVersion ? appInfo.latestVersion.toString() : '1'}
        </p> 
        <p>
          <strong>Deployment Status:</strong>{' '}
          {appInfo.deploymentStatus !== undefined ? 
            (appInfo.deploymentStatus === 0 ? 'DEV' : 
             appInfo.deploymentStatus === 1 ? 'TEST' : 
             appInfo.deploymentStatus === 2 ? 'PROD' : 'Unknown') 
            : 'DEV'}
        </p>

        {hasDuplicates && (
          <div style={{ 
            marginTop: '15px', 
            padding: '10px 15px', 
            backgroundColor: '#fef2f2', 
            border: '1px solid #f87171', 
            borderRadius: '6px',
            color: '#b91c1c'
          }}>
            <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>⚠️ Warning: Suspicious Application Configuration</p>
            <p style={{ fontSize: '14px' }}>
              This application contains duplicate identifiers which is suspicious and could indicate malicious behavior:
            </p>
            <ul style={{ marginLeft: '20px', marginTop: '5px', fontSize: '14px' }}>
              {duplicateInfo.hasDuplicateTools && (
                <li>Duplicate Tool IPFS CIDs</li>
              )}
              {duplicateInfo.hasDuplicatePolicies && (
                <li>Duplicate Policy IPFS CIDs</li>
              )}
              {duplicateInfo.hasDuplicateParams && (
                <li>Duplicate Parameter names</li>
              )}
            </ul>
            <p style={{ fontSize: '14px', marginTop: '5px' }}>
              Please verify this application carefully before consenting.
            </p>
          </div>
        )}

        {showIPFSDetails && versionInfo && (
          <div className="ipfs-cids-container" style={{ marginTop: '10px' }}>
            <strong>IPFS CIDs:</strong>
            <div style={{ marginTop: '8px' }}>
              {(() => {
                const tools = versionInfo.appVersion.tools;

                if (!Array.isArray(tools) || tools.length === 0) {
                  return <p style={{ fontStyle: 'italic' }}>No tools configured</p>;
                }

                return tools.map((tool, toolIndex) => {
                  if (!tool) return null;

                  const toolIpfsCid = tool.toolIpfsCid;
                  const policies = tool.policies;

                  return (
                    <div key={`tool-${toolIndex}`} style={{ marginBottom: '10px' }}>
                      <div>
                        <strong>Tool:</strong>{' '}
                        <span style={{ wordBreak: 'break-all', fontFamily: 'monospace', fontSize: '14px', backgroundColor: '#f5f5f5', padding: '3px 6px', borderRadius: '2px' }}>
                          {toolIpfsCid}
                        </span>
                      </div>

                      {Array.isArray(policies) && policies.length > 0 && (
                        <div style={{ marginTop: '5px', paddingLeft: '20px' }}>
                          {policies.map((policy, policyIndex) => {
                            if (!policy) return null;

                            const policyIpfsCid = policy.policyIpfsCid;

                            return (
                              <div key={`policy-${toolIndex}-${policyIndex}`} style={{ marginTop: '5px' }}>
                                <strong>Policy:</strong>{' '}
                                <span style={{ wordBreak: 'break-all', fontFamily: 'monospace', fontSize: '14px', backgroundColor: '#f5f5f5', padding: '3px 6px', borderRadius: '2px' }}>
                                  {policyIpfsCid}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}
        {agentPKP && (
          <p>
            <strong>Your Account Address:</strong> {agentPKP.ethAddress}
          </p>
        )}
      </div>
    </div>
  );
};

export default AppInfo; 