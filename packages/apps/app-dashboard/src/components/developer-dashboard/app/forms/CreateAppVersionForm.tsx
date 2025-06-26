import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ToolSelectionSchema } from '@/utils/developer-dashboard/app-forms';
import { LongTextField } from '../../form-fields';

export const CreateAppVersionSchema = z
  .object({
    changes: z
      .string()
      .min(1, 'Changes description is required')
      .describe('Describes what changed between this version and the previous version.'),
    // Tools for this version with proper typing
    tools: z.array(ToolSelectionSchema).optional().describe('Tools to include in this version'),
  })
  .strict();

export type CreateAppVersionFormData = z.infer<typeof CreateAppVersionSchema>;

interface CreateAppVersionFormProps {
  appData: any;
  onSubmit: (data: CreateAppVersionFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export function CreateAppVersionForm({
  appData,
  onSubmit,
  isSubmitting = false,
}: CreateAppVersionFormProps) {
  const form = useForm<CreateAppVersionFormData>({
    resolver: zodResolver(CreateAppVersionSchema),
    defaultValues: {
      changes: '',
      tools: [],
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Create App Version</CardTitle>
        <CardDescription>Create a new version of {appData.name} and select tools</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <LongTextField
              name="changes"
              register={register}
              errors={errors}
              label="Changes"
              placeholder="Describe what changed in this version..."
              rows={4}
              required
            />

            {/* TODO: Add EntitySelector for tools field when needed */}
            {/* For now, tools will be empty array as set in defaultValues */}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Creating Version...' : 'Create Version'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
