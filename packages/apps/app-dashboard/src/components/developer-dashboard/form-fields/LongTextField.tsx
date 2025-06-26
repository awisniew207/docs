import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { UseFormRegister, FieldErrors } from 'react-hook-form';

interface LongTextFieldProps {
  name: string;
  register: UseFormRegister<any>;
  errors: FieldErrors;
  label: string;
  placeholder?: string;
  required?: boolean;
  rows?: number;
}

export function LongTextField({
  name,
  register,
  errors,
  label,
  placeholder,
  required = false,
  rows = 3,
}: LongTextFieldProps) {
  const error = errors[name];

  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Textarea
        id={name}
        rows={rows}
        placeholder={placeholder}
        {...register(name)}
        className={error ? 'border-red-500' : ''}
      />
      {error?.message && <p className="text-sm text-red-500">{String(error.message)}</p>}
    </div>
  );
}
