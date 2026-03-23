/**
 * Toast.jsx
 * Auto-dismissing toast notification.
 */
import { AnimatePresence, motion } from 'framer-motion';

export default function Toast({ message, visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="toast"
          initial={{ opacity: 0, y: -16, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.92 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          role="alert"
          aria-live="polite"
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
