import React from 'react';
import { AppView } from '../types';
import StatusMessage from './StatusMessage';

interface UntrustedUriErrorProps {
  redirectUri: string | null;
  appInfo: AppView | null;
  statusMessage: string;
  statusType: 'info' | 'warning' | 'success' | 'error';
}

const UntrustedUriError = ({ 
  redirectUri, 
  appInfo, 
  statusMessage, 
  statusType 
}: UntrustedUriErrorProps) => {
  return (
    <div className="consent-form-container">
      <h1>Untrusted URI</h1>
      <StatusMessage message={statusMessage} type={statusType} />
      
      <div className="alert alert--error" style={{display: "block"}}>
        <p style={{display: "block"}}>This application is trying to redirect to a URI that is not on its list of authorized redirect URIs. For your security, this request has been blocked.</p>
        {redirectUri && (
          <div style={{display: "block", marginTop: "12px", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.2)"}}>
            <div style={{display: "block"}}>
              <strong>Untrusted URI:</strong>
            </div>
            <div style={{display: "block", marginTop: "8px", paddingLeft: "0"}}>
              <span style={{whiteSpace: "normal", wordBreak: "break-all", fontFamily: "monospace"}}>{redirectUri}</span>
            </div>
          </div>
        )}
      </div>
      
      <div className="details-card" style={{flexDirection: "column", backgroundColor: "#f5f5f5", border: "1px solid #e5e7eb"}}>
        <h4 style={{marginTop: 0, marginBottom: "0.5rem", fontSize: "1rem"}}>Authorized Redirect URIs:</h4>
        {appInfo && appInfo.authorizedRedirectUris && appInfo.authorizedRedirectUris.length > 0 ? (
          <ul className="permissions-list" style={{marginTop: "0.5rem"}}>
            {appInfo.authorizedRedirectUris.map((uri, index) => (
              <li key={index} style={{backgroundColor: "#ffffff", fontSize: "0.875rem"}}>{uri}</li>
            ))}
          </ul>
        ) : (
          <p style={{fontSize: "0.875rem"}}>No authorized redirect URIs have been configured for this application.</p>
        )}
      </div>
    </div>
  );
};

export default UntrustedUriError; 