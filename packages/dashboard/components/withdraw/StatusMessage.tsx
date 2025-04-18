import React from 'react';
import { StatusType } from './types';

interface StatusMessageProps {
  message: string | null;
  type: StatusType;
}

const StatusMessage: React.FC<StatusMessageProps> = ({ message, type }) => {
  if (!message) return null;
  
  return (
    <div 
      className={`status-message status-${type}`}
      dangerouslySetInnerHTML={{ __html: message }}
    />
  );
};

export default StatusMessage; 