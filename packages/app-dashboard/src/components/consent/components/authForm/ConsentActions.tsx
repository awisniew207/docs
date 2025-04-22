import { Button } from '@/components/ui/button';

interface ConsentActionsProps {
  onApprove: () => void;
  onDisapprove: () => void;
  submitting: boolean;
  disabled?: boolean;
}

const ConsentActions = ({ onApprove, onDisapprove, submitting, disabled = false }: ConsentActionsProps) => {
  return (
    <div className='flex gap-3 mb-4'>
      <Button
        variant='outline'
        onClick={onApprove}
        disabled={submitting || disabled}
        title={disabled ? 'This app version is disabled' : undefined}
      >
        {submitting ? 'Processing...' : 'Approve'}
      </Button>
      <Button
        variant='destructive'
        onClick={onDisapprove}
        disabled={submitting}
      >
        {submitting ? 'Processing...' : 'Decline'}
      </Button>
    </div>
  );
};

export default ConsentActions;
