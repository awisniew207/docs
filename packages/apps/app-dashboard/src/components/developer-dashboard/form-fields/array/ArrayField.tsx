import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue } from 'react-hook-form';

interface ArrayFieldProps {
  name: string;
  register: UseFormRegister<any>;
  errors: FieldErrors;
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
  label: string;
  placeholder?: string;
  required?: boolean;
}

export function ArrayField({
  name,
  register,
  errors,
  watch,
  setValue,
  label,
  placeholder,
  required = false,
}: ArrayFieldProps) {
  const currentValues = watch(name) || [''];
  const arrayError = errors[name];
  const arrayErrors = errors[name] as any; // For individual item errors

  const addField = () => {
    setValue(name, [...currentValues, '']);
  };

  const removeField = (index: number) => {
    const newValues = currentValues.filter((_: any, i: number) => i !== index);
    setValue(name, newValues);
  };

  // Helper function to get error for a specific index
  const getFieldError = (index: number) => {
    return arrayErrors?.[index]?.message;
  };

  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <div className="space-y-2">
        {currentValues.map((_: string, index: number) => {
          const fieldError = getFieldError(index);
          return (
            <div key={index} className="space-y-1">
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder={placeholder}
                  {...register(`${name}.${index}`)}
                  className={fieldError || arrayError ? 'border-red-500 flex-1' : 'flex-1'}
                />
                {currentValues.length > 1 && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeField(index)}
                  >
                    Remove
                  </Button>
                )}
              </div>
              {fieldError && <p className="text-sm text-red-500">{fieldError}</p>}
            </div>
          );
        })}
        <Button type="button" variant="outline" size="sm" onClick={addField}>
          + Add
        </Button>
      </div>
      {arrayError?.message && <p className="text-sm text-red-500">{String(arrayError.message)}</p>}
    </div>
  );
}
