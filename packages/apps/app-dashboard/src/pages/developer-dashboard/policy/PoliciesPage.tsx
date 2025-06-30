import { useNavigate } from 'react-router';
import { PoliciesList } from '@/components/developer-dashboard/ui/ResourceLists';
import { Policy } from '@/types/developer-dashboard/appTypes';

export default function PoliciesPage() {
  const navigate = useNavigate();

  return (
    <PoliciesList
      onCreateClick={() => navigate('/developer/create-policy')}
      onPolicyClick={(policy: Policy) =>
        navigate(`/developer/policyId/${encodeURIComponent(policy.packageName)}`)
      }
    />
  );
}
