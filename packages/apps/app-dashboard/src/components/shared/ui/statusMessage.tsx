const statusClasses = {
  info: {
    container:
      'bg-blue-50 dark:!bg-blue-900/30 text-blue-700 dark:!text-blue-300 border border-blue-200 dark:!border-blue-700/30',
    icon: 'text-blue-700 dark:!text-blue-300',
  },
  warning: {
    container:
      'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-700/30',
    icon: 'text-yellow-700 dark:text-yellow-300',
  },
  success: {
    container:
      'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700/30',
    icon: 'text-green-700 dark:text-green-300',
  },
  error: {
    container:
      'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700/30',
    icon: 'text-red-700 dark:text-red-300',
  },
};

export const StatusMessage = ({
  message,
  type = 'info',
}: {
  message: string;
  type?: 'info' | 'warning' | 'success' | 'error';
}) => {
  if (!message) return null;

  // Get the appropriate classes for the current status type
  const classes = statusClasses[type];

  return (
    <div
      className={`flex items-center p-3 mb-4 rounded-lg text-sm leading-normal w-full transition-all min-h-[48px] opacity-100 ${classes.container}`}
    >
      <span className="ml-3 transition-opacity">{message}</span>
    </div>
  );
};
