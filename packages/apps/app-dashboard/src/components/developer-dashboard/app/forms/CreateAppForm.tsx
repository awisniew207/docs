import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  TextField,
  LongTextField,
  ArrayField,
  SelectField,
  ImageUploadField,
} from '../../form-fields';

export const CreateAppSchema = z
  .object({
    name: z.string().min(1, 'App name is required'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    contactEmail: z.string().email('Please enter a valid email address'),
    appUserUrl: z.string().url('Please enter a valid URL'),
    logo: z.string().optional(),
    redirectUris: z
      .array(z.string().url('Please enter valid URLs'))
      .min(1, 'At least one redirect URI is required'),
    deploymentStatus: z.enum(['dev', 'test', 'prod']),
  })
  .strict();

export type CreateAppFormData = z.infer<typeof CreateAppSchema>;

interface CreateAppFormProps {
  onSubmit: (data: CreateAppFormData) => Promise<void>;
  isSubmitting?: boolean;
}

const deploymentStatusOptions = [
  { value: 'dev', label: 'Development' },
  { value: 'test', label: 'Test' },
  { value: 'prod', label: 'Production' },
];

export function CreateAppForm({ onSubmit, isSubmitting = false }: CreateAppFormProps) {
  const form = useForm<CreateAppFormData>({
    resolver: zodResolver(CreateAppSchema),
    defaultValues: {
      redirectUris: [''],
      deploymentStatus: undefined,
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    setError,
    clearErrors,
    formState: { errors },
  } = form;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Create New App</CardTitle>
        <CardDescription>
          Create a new blockchain application and select initial tools
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <TextField
              name="name"
              register={register}
              errors={errors}
              label="App Name"
              placeholder="Enter app name"
              required
            />

            <TextField
              name="contactEmail"
              register={register}
              errors={errors}
              label="Contact Email"
              placeholder="contact@example.com"
              required
            />

            <LongTextField
              name="description"
              register={register}
              errors={errors}
              label="Description"
              placeholder="Describe your application"
              rows={4}
              required
            />

            <TextField
              name="appUserUrl"
              register={register}
              errors={errors}
              label="App User URL"
              placeholder="https://yourapp.com"
              required
            />

            <ImageUploadField
              name="logo"
              watch={watch}
              setValue={setValue}
              control={control}
              setError={setError}
              clearErrors={clearErrors}
              label="Logo"
            />

            <ArrayField
              name="redirectUris"
              register={register}
              errors={errors}
              watch={watch}
              setValue={setValue}
              label="Redirect URIs"
              placeholder="https://yourapp.com/callback"
              required
            />

            <SelectField
              name="deploymentStatus"
              errors={errors}
              watch={watch}
              setValue={setValue}
              label="Deployment Status"
              options={deploymentStatusOptions}
              required
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Creating App...' : 'Create App'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
