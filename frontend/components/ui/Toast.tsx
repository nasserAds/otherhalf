'use client';

import { createContext, useCallback, useContext, useState, ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface ToastContextValue {
  show: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);

  const show = useCallback((msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 1800);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              className="bg-ink-700 border border-mint text-fg-100 text-[13px] font-bold px-[18px] py-[10px] rounded-pill whitespace-nowrap"
            >
              {message}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
