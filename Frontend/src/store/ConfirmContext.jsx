import { createContext, useCallback, useContext, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import './ConfirmContext.css';

const ConfirmContext = createContext(null);

/**
 * Provides a global confirm dialog. Usage:
 *   const confirm = useConfirm();
 *   if (await confirm({ title: 'Sign out?', body: '...', danger: true })) { ... }
 */
export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);

  const confirm = useCallback(
    (opts) =>
      new Promise((resolve) => {
        setState({
          title: 'Are you sure?',
          body: '',
          confirmLabel: 'Confirm',
          cancelLabel: 'Cancel',
          danger: false,
          ...opts,
          resolve,
        });
      }),
    []
  );

  const close = (value) => {
    state?.resolve(value);
    setState(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AnimatePresence>
        {state && (
          <motion.div
            className="cf-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => close(false)}
          >
            <motion.div
              className="cf-dialog"
              initial={{ scale: 0.85, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 240, damping: 18 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="cf-close" onClick={() => close(false)} aria-label="Close">
                <X size={18} />
              </button>
              <div className={`cf-icon ${state.danger ? 'danger' : ''}`}>
                <AlertTriangle size={26} />
              </div>
              <h3 className="cf-title">{state.title}</h3>
              {state.body && <p className="cf-body">{state.body}</p>}
              <div className="cf-actions">
                <button className="btn btn-ghost" onClick={() => close(false)}>
                  {state.cancelLabel}
                </button>
                <button
                  className={`btn ${state.danger ? 'btn-danger' : 'btn-primary'}`}
                  onClick={() => close(true)}
                  autoFocus
                >
                  {state.confirmLabel}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
}

export const useConfirm = () => {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within <ConfirmProvider>');
  return ctx;
};
