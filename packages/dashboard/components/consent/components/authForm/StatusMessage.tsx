import React from 'react';

interface StatusMessageProps {
  message: string;
  type?: 'info' | 'warning' | 'success' | 'error';
}

const StatusMessage = ({ message, type = 'info' }: StatusMessageProps) => {
  if (!message) return null;
  
  const getStatusClass = () => {
    switch (type) {
      case 'warning': return 'status-message--warning';
      case 'success': return 'status-message--success';
      case 'error': return 'status-message--error';
      default: return 'status-message--info';
    }
  };
  
  return (
    <div className={`status-message ${getStatusClass()}`}>
      {type === 'info' && <div className="spinner"></div>}
      <span>{message}</span>
    </div>
  );
};

export default StatusMessage; 