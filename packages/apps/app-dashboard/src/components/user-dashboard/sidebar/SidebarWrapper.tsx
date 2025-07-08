import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { Sidebar } from './Sidebar';
import Loading from '@/components/shared/ui/Loading';
import { StatusMessage } from '@/components/shared/ui/statusMessage';

export function SidebarWrapper() {
  const { data: apps, isLoading, isError, error } = vincentApiClient.useListAppsQuery();
  
  if (isLoading) return <Loading />;
  if (isError) return <StatusMessage message={String(error)} type='error' />;
  
  return <Sidebar apps={apps || []} />;
}