'use client';

import { useToastStore, Toast } from '@/store/toastStore';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const iconMap = {
    success: <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />,
    error: <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />,
    info: <Info className="h-5 w-5 text-foreground shrink-0" />,
    warning: <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />,
  };

  const borderMap = {
    success: 'border-l-emerald-500',
    error: 'border-l-red-500',
    info: 'border-l-neutral-600',
    warning: 'border-l-amber-500',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      className={`pointer-events-auto flex items-center justify-between gap-3 p-4 rounded-xl border border-l-4 border-neutral-800 bg-card/90 backdrop-blur-md shadow-lg ${borderMap[toast.type]} select-none`}
    >
      <div className="flex items-center gap-3">
        {iconMap[toast.type]}
        <span className="text-sm font-medium text-foreground">{toast.message}</span>
      </div>
      <button
        onClick={onClose}
        className="text-foreground hover:text-primary transition-colors p-1 rounded-lg hover:bg-neutral-800/50"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}
