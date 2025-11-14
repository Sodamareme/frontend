import { motion, AnimatePresence } from "framer-motion";

interface FormErrorProps {
  message?: string;
}

export function FormError({ message }: FormErrorProps) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="text-red-500 text-sm mt-1"
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}