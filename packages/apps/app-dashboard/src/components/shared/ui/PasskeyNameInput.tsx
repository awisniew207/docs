import * as React from 'react';
import { cn } from '@/lib/utils';

interface PasskeyNameInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
  label?: string;
  description?: string;
  theme?: any;
}

export function PasskeyNameInput({
  value,
  onChange,
  placeholder = 'Vincent Passkey',
  error,
  required = false,
  className,
  disabled = false,
  label = 'Passkey Name',
  description = 'Give your passkey a memorable name to help you identify it later',
  theme,
}: PasskeyNameInputProps) {
  const inputId = React.useId();
  const descriptionId = React.useId();
  const errorId = React.useId();

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label
          htmlFor={inputId}
          className={`text-sm font-medium block ${theme?.text || 'text-gray-900 dark:text-gray-100'}`}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {description && (
        <p
          id={descriptionId}
          className={`text-sm ${theme?.textMuted || 'text-gray-500 dark:text-gray-400'}`}
        >
          {description}
        </p>
      )}

      <input
        id={inputId}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        aria-describedby={description ? descriptionId : undefined}
        aria-invalid={!!error}
        aria-errormessage={error ? errorId : undefined}
        className={`w-full px-3 py-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400 ${theme?.cardBg || 'bg-white dark:bg-gray-800'} ${theme?.cardBorder || 'border-gray-200 dark:border-gray-700'} ${theme?.text || 'text-gray-900 dark:text-gray-100'} ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      />

      {error && (
        <p id={errorId} className="text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}
