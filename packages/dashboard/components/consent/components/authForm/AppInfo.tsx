import React from 'react';
import { AppView } from '../../types';
import { IRelayPKP } from '@lit-protocol/types';

interface AppInfoProps {
  appInfo: AppView;
  agentPKP?: IRelayPKP;
  versionInfo?: any;
  showIPFSDetails?: boolean;
}

const AppInfo = ({ 
  appInfo, 
  agentPKP, 
  versionInfo,
  showIPFSDetails = true
}: AppInfoProps) => {
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
        {agentPKP && (
          <p>
            <strong>PKP Address:</strong> {agentPKP.ethAddress}
          </p>
        )}
        <p>
          <strong>Version:</strong>{' '}
          {appInfo.latestVersion ? appInfo.latestVersion.toString() : '1'}
        </p>
        
        {showIPFSDetails && versionInfo && (
          <div className="ipfs-cids-container" style={{ marginTop: '10px' }}>
            <strong>IPFS CIDs:</strong>
            <div style={{ marginTop: '8px' }}>
              {(() => {
                const toolsData = versionInfo.appVersion?.tools || versionInfo[1]?.[3];
                
                if (!toolsData || !Array.isArray(toolsData) || toolsData.length === 0) {
                  return <p style={{ fontStyle: 'italic' }}>No tools configured</p>;
                }
                
                return toolsData.map((tool: any, toolIndex: number) => {
                  if (!tool || !Array.isArray(tool) || !tool[0]) return null;
                  
                  const toolIpfsCid = tool[0];
                  const policies = tool[1];
                  
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
                          {policies.map((policy: any, policyIndex: number) => {
                            if (!policy || !Array.isArray(policy) || !policy[0]) return null;
                            
                            const policyIpfsCid = policy[0];
                            
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
      </div>
    </div>
  );
};

export default AppInfo; 