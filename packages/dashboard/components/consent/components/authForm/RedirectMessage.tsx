import React from 'react';
import StatusMessage from './StatusMessage';
import StatusAnimation from './StatusAnimation';

interface RedirectMessageProps {
  showSuccess: boolean;
  showDisapproval: boolean;
  statusMessage: string;
  statusType: 'info' | 'warning' | 'success' | 'error';
}

const RedirectMessage = ({
  showSuccess,
  showDisapproval,
  statusMessage,
  statusType
}: RedirectMessageProps) => {
  return (
    <div className='container'>
      <div className='consent-form-container'>
        <StatusMessage message={statusMessage} type={statusType} />
        {showSuccess && <StatusAnimation type="success" />}
        {showDisapproval && <StatusAnimation type="disapproval" />}
      </div>
    </div>
  );
};

export default RedirectMessage; 