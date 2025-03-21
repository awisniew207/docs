'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { ArrowLeft } from 'lucide-react';
import { useAccount } from 'wagmi';
import { AppView } from '@/services/types';

const formSchema = z.object({
  appName: z
    .string()
    .min(2, 'App name must be at least 2 characters')
    .max(50, 'App name cannot exceed 50 characters'),
  appDescription: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description cannot exceed 500 characters'),
  email: z.string().email('Must be a valid email address'),
  domain: z
    .string()
    .transform((val) => {
      if (!val) return val;
      return val;
    })
    .pipe(z.string().url('Must be a valid URL'))
    .optional(),
});

interface AppManagerProps {
  onBack: () => void;
  dashboard: AppView;
  onSuccess: () => void;
}

export default function ManageAppScreen({
  onBack,
  dashboard,
  onSuccess,
}: AppManagerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { address } = useAccount();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      appName: dashboard?.appName || '',
      appDescription: dashboard?.description || '',
      email: dashboard?.appMetadata?.email || '',
    },
  });

  async function onSubmit() {
    try {
      setIsSubmitting(true);

      if (!address) return;
  
      onSuccess();
    } catch (error) {
      console.error('Error updating app:', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="default" size="sm" onClick={onBack} className="text-black">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold text-black">Manage Application</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-black">Update Application Info</CardTitle>
            <CardDescription className="text-black">
              Update your application&apos;s off-chain information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="appName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-black">Application Name</FormLabel>
                      <FormControl>
                        <Input {...field} className="text-black" />
                      </FormControl>
                      <FormMessage className="text-black" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="appDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-black">Description</FormLabel>
                      <FormControl>
                        <Textarea rows={4} {...field} className="text-black" />
                      </FormControl>
                      <FormMessage className="text-black" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-black">Contact Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} className="text-black" />
                      </FormControl>
                      <FormMessage className="text-black" />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full text-black"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Updating...' : 'Update Application'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-black">Application Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-black">
                  <div className="font-medium">App Name</div>
                  <div className="mt-1">{dashboard.appName}</div>
                </div>
                <div className="text-sm text-black">
                  <div className="font-medium">Manager Address</div>
                  <div className="mt-1 break-all">
                    {dashboard.managementWallet}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-black">Allowed Delegatees</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {dashboard.delegatees.map((delegatee: string) => (
                  <div key={delegatee} className="text-sm break-all text-black">
                    {delegatee}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
