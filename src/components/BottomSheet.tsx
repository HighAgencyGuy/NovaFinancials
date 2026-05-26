import { AnimatePresence, motion } from "framer-motion";
import { type ReactNode } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
}

export function BottomSheet({ open, onClose, children, title }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/20"
            onClick={onClose}
          />
          <motion.div
            key="sheet"
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="fixed left-0 right-0 bottom-0 z-50 neu-float rounded-t-[32px] p-6 pt-4 max-h-[92dvh] overflow-y-auto"
            style={{ background: "var(--bg)" }}
          >
            <div className="flex justify-center mb-4">
              <div className="neu-pressed rounded-full w-12 h-1.5" />
            </div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-semibold text-lg">{title}</h2>
              <button
                onClick={onClose}
                aria-label="Close"
                className="neu-raised w-10 h-10 rounded-full grid place-items-center text-text-muted active:[box-shadow:var(--neu-pressed)]"
              >✕</button>
            </div>
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
