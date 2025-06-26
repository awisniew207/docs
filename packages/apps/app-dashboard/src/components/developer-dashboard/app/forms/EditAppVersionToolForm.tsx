import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { docSchemas } from '@lit-protocol/vincent-registry-sdk';
import { ArrayField } from '../../form-fields';

export const EditAppVersionToolSchema = z
  .object({
    hiddenSupportedPolicies: docSchemas.appVersionToolDoc.shape.hiddenSupportedPolicies.optional(),
  })
  .partial()
  .strict();

export type EditAppVersionToolFormData = z.infer<typeof EditAppVersionToolSchema>;

interface EditAppVersionToolFormProps {
  tool: any;
  onSubmit: (data: EditAppVersionToolFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function EditAppVersionToolForm({
  tool,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: EditAppVersionToolFormProps) {
  const form = useForm<EditAppVersionToolFormData>({
    resolver: zodResolver(EditAppVersionToolSchema),
    defaultValues: {
      hiddenSupportedPolicies: tool.hiddenSupportedPolicies || [],
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = form;

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <ArrayField
          name="hiddenSupportedPolicies"
          register={register}
          errors={errors}
          watch={watch}
          setValue={setValue}
          label="Hidden Supported Policies"
          placeholder="Enter policy name"
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
