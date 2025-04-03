import React from 'react';

interface ParameterUpdateModalProps {
  isOpen: boolean;
  onContinue: () => void;
  onUpdate: () => void;
  appName: string;
}

const ParameterUpdateModal = ({ isOpen, onContinue, onUpdate, appName }: ParameterUpdateModalProps) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 m-4">
        <h3 className="text-lg font-bold mb-4">Update Parameters?</h3>
        <p className="mb-4">
          You&apos;ve already granted permission to App: <strong>{appName}</strong>. 
          Would you like to continue with your existing parameters or update them?
        </p>
        <div className="flex justify-end space-x-3">
          <button 
            className="btn btn--outline"
            onClick={onContinue}
          >
            Continue with Existing
          </button>
          <button 
            className="btn btn--primary"
            onClick={onUpdate}
          >
            Update Parameters
          </button>
        </div>
      </div>
    </div>
  );
};

export default ParameterUpdateModal; 