"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";
import { useToast, type Toast as ToastType } from "@/lib/toast-context";
import { cn } from "@/lib/utils";

function Toast({ toast, onClose }: { toast: ToastType; onClose: () => void }) {
  const iconClass = "h-5 w-5 flex-shrink-0";
  const icons = {
    success: <CheckCircle className={cn(iconClass, "text-flc-success")} />,
    error: <AlertCircle className={cn(iconClass, "text-flc-danger")} />,
    info: <Info className={cn(iconClass, "text-flc-primary")} />
  };

  const backgrounds = {
    success: "bg-flc-success/10 border-flc-success/30",
    error: "bg-flc-danger/10 border-flc-danger/30",
    info: "bg-flc-primary/10 border-flc-primary/30"
  };

  const textColors = {
    success: "text-flc-success",
    error: "text-flc-danger",
    info: "text-flc-primary"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.95 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(
        "flex items-center gap-3 rounded-lg border px-4 py-3 backdrop-blur-sm",
        backgrounds[toast.type]
      )}
    >
      {icons[toast.type]}
      <p className={cn("flex-1 text-sm font-medium", textColors[toast.type])}>
        {toast.message}
      </p>
      <button
        onClick={onClose}
        className="ml-2 p-1 text-current opacity-50 transition-opacity hover:opacity-100"
        aria-label="Close"
      >
        <X size={16} />
      </button>
    </motion.div>
  );
}

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 max-w-sm pointer-events-none md:max-w-md">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast
              toast={toast}
              onClose={() => removeToast(toast.id)}
            />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
