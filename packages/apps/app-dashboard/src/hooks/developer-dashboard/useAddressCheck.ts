import { useAccount } from 'wagmi';
import { useNavigate } from 'react-router';

export function useAddressCheck(app: any) {
  const navigate = useNavigate();
  const { address } = useAccount();

  if (!app) return;

  // Authorization check
  if (app.managerAddress.toLowerCase() !== address?.toLowerCase()) {
    navigate('/developer');
  }
}
