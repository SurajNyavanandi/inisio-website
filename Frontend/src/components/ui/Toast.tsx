import React, { createContext, useContext, useState, useCallback } from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { X, CheckCircle2, AlertCircle, Info, Bell } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  title?: string;
  description: string;
  type?: ToastType;
  duration?: number;
}

interface ToastContextType {
  toast: (description: string, options?: { title?: string; type?: ToastType; duration?: number }) => void;
  success: (description: string, title?: string) => void;
  error: (description: string, title?: string) => void;
  info: (description: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Global dispatcher to allow replacing window.alert seamlessly anywhere
let globalToastDispatcher: ((msg: ToastMessage) => void) | null = null;

export const showToast = (
  description: string,
  options?: { title?: string; type?: ToastType; duration?: number }
) => {
  if (globalToastDispatcher) {
    globalToastDispatcher({
      id: Math.random().toString(36).substring(2, 9),
      description,
      title: options?.title,
      type: options?.type || 'info',
      duration: options?.duration || 4000
    });
  } else {
    console.log(`[Toast ${options?.type || 'info'}]:`, description);
  }
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((msg: ToastMessage) => {
    setToasts((prev) => [...prev.slice(-4), msg]);
  }, []);

  React.useEffect(() => {
    globalToastDispatcher = addToast;
    return () => {
      globalToastDispatcher = null;
    };
  }, [addToast]);

  const toast = useCallback(
    (description: string, options?: { title?: string; type?: ToastType; duration?: number }) => {
      addToast({
        id: Math.random().toString(36).substring(2, 9),
        description,
        title: options?.title,
        type: options?.type || 'info',
        duration: options?.duration || 4000
      });
    },
    [addToast]
  );

  const success = useCallback((description: string, title?: string) => {
    toast(description, { title, type: 'success' });
  }, [toast]);

  const error = useCallback((description: string, title?: string) => {
    toast(description, { title, type: 'error' });
  }, [toast]);

  const info = useCallback((description: string, title?: string) => {
    toast(description, { title, type: 'info' });
  }, [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, info }}>
      <ToastPrimitive.Provider swipeDirection="right">
        {children}
        {toasts.map((t) => {
          const isError = t.type === 'error' || t.type === 'warning';
          const isSuccess = t.type === 'success';

          return (
            <ToastPrimitive.Root
              key={t.id}
              duration={t.duration || 4000}
              onOpenChange={(open) => {
                if (!open) {
                  setToasts((prev) => prev.filter((item) => item.id !== t.id));
                }
              }}
              className={`flex items-start gap-3 w-full max-w-sm p-4 bg-white rounded-2xl border shadow-xl font-inter transition-all data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=cancel]:translate-x-0 data-[swipe=cancel]:transition-[transform_200ms_ease-out] data-[swipe=end]:animate-out ${
                isError
                  ? 'border-rose-200'
                  : isSuccess
                  ? 'border-emerald-200'
                  : 'border-blue-200'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {isError ? (
                  <AlertCircle className="w-5 h-5 text-rose-600" />
                ) : isSuccess ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <Info className="w-5 h-5 text-blue-600" />
                )}
              </div>

              <div className="flex-1 space-y-0.5">
                {t.title && (
                  <ToastPrimitive.Title className="text-xs font-bold text-slate-900 font-manrope">
                    {t.title}
                  </ToastPrimitive.Title>
                )}
                <ToastPrimitive.Description className="text-xs text-slate-600 leading-relaxed font-medium">
                  {t.description}
                </ToastPrimitive.Description>
              </div>

              <ToastPrimitive.Close className="shrink-0 p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer transition-colors">
                <X className="w-4 h-4" />
              </ToastPrimitive.Close>
            </ToastPrimitive.Root>
          );
        })}
        <ToastPrimitive.Viewport className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 max-w-[420px] m-0 list-none outline-none" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      toast: showToast,
      success: (desc: string, title?: string) => showToast(desc, { title, type: 'success' }),
      error: (desc: string, title?: string) => showToast(desc, { title, type: 'error' }),
      info: (desc: string, title?: string) => showToast(desc, { title, type: 'info' })
    };
  }
  return context;
};
