import { Textarea } from '@/components/shared/ui/textarea';
import { Label } from '@/components/shared/ui/label';
import { UseFormRegister } from 'react-hook-form';

interface LongTextFieldProps {
  name: string;
  register: UseFormRegister<any>;
  error?: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  rows?: number;
}

export function LongTextField({
  name,
  register,
  error,
  label,
  placeholder,
  required = false,
  rows = 3,
}: LongTextFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label}
        {required && <span className="text-red-500 dark:text-red-400 ml-1">*</span>}
      </Label>
      <Textarea
        id={name}
        rows={rows}
        placeholder={placeholder}
        {...register(name)}
        className={error ? 'border-red-500 dark:border-red-400' : ''}
      />
      {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}
    </div>
  );
}
