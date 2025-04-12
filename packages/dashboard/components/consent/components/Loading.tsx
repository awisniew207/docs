import React, { useState, useEffect } from 'react';
import StatusMessage from './authForm/StatusMessage';
import Image from 'next/image';
interface LoadingProps {
  copy: string;
  error?: Error | string;
  type?: 'info' | 'warning' | 'success' | 'error';
  isTransitioning?: boolean;
  appName?: string;
  appDescription?: string;
}

export default function Loading({
  copy,
  error,
  type = 'info',
  isTransitioning = false,
  appName,
  appDescription
}: LoadingProps) {
  const [displayMessage, setDisplayMessage] = useState(copy || '');
  const [displayType, setDisplayType] = useState(error ? 'error' : type);
  const [localTransitioning, setLocalTransitioning] = useState(false);

  // Handle smooth transitions when message changes
  useEffect(() => {
    if (copy && copy !== displayMessage) {
      setLocalTransitioning(true);

      // Use a short timeout to create a smooth fade effect
      const timer = setTimeout(() => {
        setDisplayMessage(copy);
        setDisplayType(error ? 'error' : type);
        setLocalTransitioning(false);
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [copy, displayMessage, error, type]);

  // Handle error transitions
  useEffect(() => {
    if (error) {
      setDisplayType('error');
      setDisplayMessage(typeof error === 'string' ? error : error.message || 'An error occurred');
    } else {
      setDisplayType(type);
    }
  }, [error, type]);

  // Prepare the message for display
  const messageToDisplay = error
    ? (typeof error === 'string' ? error : error.message || 'An error occurred')
    : displayMessage;

  // Use either the internal transition state or the prop-passed one
  const shouldTransition = isTransitioning || localTransitioning;

  return (
    <div className="bg-white rounded-xl shadow-lg max-w-[800px] w-full mx-auto border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center">
        <div className="h-8 w-8 rounded-md flex items-center justify-center">
          <Image src="/V.svg" alt="Vincent logo" width={20} height={20} />
        </div>
        <div className="ml-3 text-base font-medium text-gray-700">Connect with Vincent</div>
      </div>

      <div className="p-6">
        <div className="flex flex-col items-center justify-center py-8">
          <div className="status-message-container">
            <div className={`transition-opacity duration-200 ${shouldTransition ? 'opacity-0' : 'opacity-100'} w-full`}>
              <StatusMessage message={messageToDisplay} type={displayType} />
            </div>
          </div>

          {appName && (
            <div className="mt-6 text-center">
              <h3 className="text-lg font-medium text-gray-800">{appName}</h3>
              {appDescription && (
                <p className="text-gray-600 text-sm mt-1">{appDescription}</p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="px-6 py-3 text-center border-t border-gray-100">
        <p className="text-xs text-gray-400 flex items-center justify-center">
          <svg className="w-3.5 h-3.5 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 15V17M6 21H18C19.1046 21 20 20.1046 20 19V13C20 11.8954 19.1046 11 18 11H6C4.89543 11 4 11.8954 4 13V19C4 20.1046 4.89543 21 6 21ZM16 11V7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7V11H16Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Protected by Lit</span>
        </p>
      </div>
    </div>
  );
}
