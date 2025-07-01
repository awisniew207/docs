import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TextField } from '../../form-fields';

function buildConfirmationString(title: string, version: string): string {
  return `I want to delete policy ${title} version ${version}`;
}

const createDeletePolicySchema = (title: string, version: string) => {
  const expectedConfirmation = buildConfirmationString(title, version);
  return z.object({
    confirmation: z.string().refine((val) => val === expectedConfirmation, {
      message: `Please type exactly: "${expectedConfirmation}"`,
    }),
  });
};

export type DeletePolicyVersionFormData = {
  confirmation: string;
};

interface DeletePolicyVersionFormProps {
  title: string;
  version: string;
  onSubmit: (data: DeletePolicyVersionFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export function DeletePolicyVersionForm({
  title,
  version,
  onSubmit,
  isSubmitting = false,
}: DeletePolicyVersionFormProps) {
  const DeletePolicySchema = createDeletePolicySchema(title, version);

  const form = useForm<DeletePolicyVersionFormData>({
    resolver: zodResolver(DeletePolicySchema),
    defaultValues: {
      confirmation: '',
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = form;

  const expectedConfirmation = buildConfirmationString(title, version);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-red-600">Delete Policy</CardTitle>
        <CardDescription>
          Please make sure you're absolutely certain you want to delete this policy.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800 mb-2">
                To confirm deletion, please type the following exactly:
              </p>
              <code className="bg-red-100 px-2 py-1 rounded text-sm font-mono text-red-900">
                {expectedConfirmation}
              </code>
            </div>

            <TextField
              name="confirmation"
              register={register}
              error={errors.confirmation?.message}
              label="Confirmation"
              placeholder=""
              required
            />

            <Button
              type="submit"
              variant="destructive"
              className="w-full"
              disabled={isSubmitting || !isValid}
            >
              {isSubmitting ? 'Deleting Policy...' : 'Delete Policy'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
