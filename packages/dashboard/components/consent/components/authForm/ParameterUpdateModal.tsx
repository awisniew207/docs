import React from 'react';
import { useVersionEnabledCheck } from '../../hooks/useVersionEnabledCheck';

interface ParameterUpdateModalProps {
  isOpen: boolean;
  onContinue: () => void;
  onUpdate: () => void;
  appName: string;
  permittedVersion: number;
}

const ParameterUpdateModal = ({ 
  isOpen, 
  onContinue, 
  onUpdate, 
  appName, 
  permittedVersion 
}: ParameterUpdateModalProps) => {
  const { isVersionEnabled } = useVersionEnabledCheck({
    versionNumber: permittedVersion
  });
  
  if (!isOpen) return null;
  
  return (
    <div className="mt-6">
      <div className="bg-gray-50 p-4 rounded-md border border-gray-100 mb-6">
        <p className="text-sm text-gray-700 mb-2">
          You already have permission for version <span className="font-medium">{permittedVersion}</span> of <span className="font-medium">{appName}</span>.
        </p>
        <p className="text-sm text-gray-700">
          You can either continue with your existing parameters or update them.
        </p>
      </div>
      
      {isVersionEnabled === false && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800 mb-6">
          <p className="text-sm">
            <strong>Warning:</strong> Version {permittedVersion} has been disabled by the app developer. 
          </p>
        </div>
      )}
      
      <div className="flex flex-col space-y-3">
        <button

                  className="bg-white text-gray-700 border border-gray-200 rounded-lg py-3 font-medium text-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={onUpdate}
        >
          Update Policies
        </button>
        <button 
          className="bg-black text-white rounded-lg py-3 font-medium text-sm hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={onContinue}
        >
          Continue with Existing Policies
        </button>
      </div>
    </div>
  );
};

export default ParameterUpdateModal; 