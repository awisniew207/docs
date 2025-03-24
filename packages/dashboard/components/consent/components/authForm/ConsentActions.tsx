import React from 'react';

interface ConsentActionsProps {
  onApprove: () => void;
  onDisapprove: () => void;
  submitting: boolean;
}

const ConsentActions = ({ onApprove, onDisapprove, submitting }: ConsentActionsProps) => {
  return (
    <div className='consent-actions'>
      <button
        className='btn btn--primary'
        onClick={onApprove}
        disabled={submitting}
      >
        {submitting ? 'Submitting...' : 'Approve'}
      </button>
      <button
        className='btn btn--outline'
        onClick={onDisapprove}
        disabled={submitting}
      >
        Disapprove
      </button>
    </div>
  );
};

export default ConsentActions; 