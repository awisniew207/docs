import { useNavigate, useParams } from 'react-router';
import { PolicyVersionsListView } from '../views/PolicyVersionsListView';
import { useAddressCheck } from '@/hooks/developer-dashboard/tool/useAddressCheck';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import Loading from '@/components/layout/Loading';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { useUserPolicies } from '@/hooks/developer-dashboard/useUserPolicies';
import { sortPolicyFromPolicies } from '@/utils/developer-dashboard/sortPolicyFromPolicies';

export function PolicyVersionsWrapper() {
  const { packageName } = useParams<{ packageName: string }>();
  const { data: policies, isLoading: policiesLoading, isError: policiesError } = useUserPolicies();

  const policy = sortPolicyFromPolicies(policies, packageName);

  // Fetch
  const {
    data: versions,
    isLoading: versionsLoading,
    isError: versionsError,
  } = vincentApiClient.useGetPolicyVersionsQuery({ packageName: packageName! });

  // Navigation
  const navigate = useNavigate();

  useAddressCheck(policy);

  // Loading states first
  if (policiesLoading || versionsLoading) return <Loading />;

  // Combined error states
  if (policiesError) return <StatusMessage message="Failed to load policies" type="error" />;
  if (versionsError) return <StatusMessage message="Failed to load policy versions" type="error" />;
  if (!policy) return <StatusMessage message={`Policy ${packageName} not found`} type="error" />;
  if (!versions) return <StatusMessage message="No policy versions found" type="info" />;

  const handleVersionClick = (version: string) => {
    navigate(`/developer/policyId/${encodeURIComponent(packageName!)}/version/${version}`);
  };

  return (
    <PolicyVersionsListView
      versions={versions || []}
      policy={policy}
      onVersionClick={handleVersionClick}
    />
  );
}
