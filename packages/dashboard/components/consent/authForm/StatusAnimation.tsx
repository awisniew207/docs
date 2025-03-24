import React from 'react';

type StatusAnimationType = 'success' | 'disapproval' | null;

interface StatusAnimationProps {
  type: StatusAnimationType;
}

const StatusAnimation = ({ type }: StatusAnimationProps) => {
  if (!type) return null;

  return (
    <div className='animation-overlay'>
      {type === 'success' && (
        <svg className='success-checkmark' viewBox='0 0 52 52'>
          <circle
            className='success-checkmark__circle'
            cx='26'
            cy='26'
            r='25'
            fill='none'
          />
          <path
            className='success-checkmark__check'
            fill='none'
            d='M14.1 27.2l7.1 7.2 16.7-16.8'
          />
        </svg>
      )}

      {type === 'disapproval' && (
        <svg className='error-x' viewBox='0 0 52 52'>
          <circle
            className='error-x__circle'
            cx='26'
            cy='26'
            r='25'
            fill='none'
          />
          <line
            className='error-x__line error-x__line--first'
            x1='16'
            y1='16'
            x2='36'
            y2='36'
          />
          <line
            className='error-x__line error-x__line--second'
            x1='36'
            y1='16'
            x2='16'
            y2='36'
          />
        </svg>
      )}
    </div>
  );
};

export default StatusAnimation; 