import { motion } from 'framer-motion';
import { Button } from '@/components/shared/ui/button';
import { ThemeType } from './theme';

interface ActionButtonsProps {
  theme: ThemeType;
  onDecline?: () => void;
  onSubmit: () => void;
}

export function ActionButtons({ theme, onDecline, onSubmit }: ActionButtonsProps) {
  return (
    <div className="flex justify-end gap-4 pt-4">
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Button
          variant="ghost"
          onClick={onDecline}
          className={`px-6 py-2 border ${theme.cardBorder} ${theme.text} hover:bg-red-500/10 hover:text-red-400 hover:border-red-400/30`}
        >
          Decline
        </Button>
      </motion.div>
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Button
          onClick={onSubmit}
          className={`px-6 py-2 ${theme.accentBg} ${theme.accentHover} border-0`}
        >
          Grant Permissions
        </Button>
      </motion.div>
    </div>
  );
} 