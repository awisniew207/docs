import { FieldErrors, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { SelectField } from '..';

const deploymentStatusOptions = [
  { value: 'dev', label: 'Development' },
  { value: 'test', label: 'Test' },
  { value: 'prod', label: 'Production' },
];

export function DeploymentStatusSelectField({
  errors,
  watch,
  setValue,
}: {
  errors: FieldErrors;
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
}) {
  return (
    <SelectField
      name="deploymentStatus"
      errors={errors}
      watch={watch}
      setValue={setValue}
      label="Deployment Status"
      options={deploymentStatusOptions}
      required
    />
  );
}
