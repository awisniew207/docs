import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UseFormRegister, FieldErrors, Control, useFieldArray } from 'react-hook-form';
import { useEffect } from 'react';

interface ArrayFieldProps {
  name: string;
  register: UseFormRegister<any>;
  errors: FieldErrors;
  control: Control<any>;
  label: string;
  placeholder?: string;
  required?: boolean;
}

export function ArrayField({
  name,
  register,
  errors,
  control,
  label,
  placeholder,
  required = false,
}: ArrayFieldProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name,
  });

  // Ensure at least one field exists
  useEffect(() => {
    if (fields.length === 0) {
      append('');
    }
  }, [fields.length, append]);

  const arrayError = errors[name];
  const hasArrayError = arrayError && !Array.isArray(arrayError);

  const getFieldError = (index: number) => {
    if (Array.isArray(arrayError)) {
      return arrayError[index]?.message;
    }
    return undefined;
  };

  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>

      <div className="space-y-2">
        {fields.map((field, index) => {
          const fieldError = getFieldError(index);
          const hasError = fieldError || hasArrayError;

          return (
            <div key={field.id} className="space-y-1">
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder={placeholder}
                  {...register(`${name}.${index}`)}
                  className={hasError ? 'border-red-500 flex-1' : 'flex-1'}
                />
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => remove(index)}
                  >
                    Remove
                  </Button>
                )}
              </div>
              {fieldError && <p className="text-sm text-red-500">{fieldError}</p>}
            </div>
          );
        })}

        <Button type="button" variant="outline" size="sm" onClick={() => append('')}>
          + Add
        </Button>
      </div>

      {/* Show array-level error only if it's not an array of field errors */}
      {hasArrayError && <p className="text-sm text-red-500">{String(arrayError.message)}</p>}
    </div>
  );
}
