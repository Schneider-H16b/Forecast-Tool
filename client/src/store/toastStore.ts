import { create } from 'zustand';

export type ToastKind = 'info' | 'success' | 'error';

export interface Toast {
  id: string;
  kind: ToastKind;
  message: string;
  timeoutMs?: number;
}

interface ToastState {
  toasts: Toast[];
  add: (t: Omit<Toast, 'id'>) => void;
  remove: (id: string) => void;
  clear: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  add: (t) => set((s) => {
    const id = crypto.randomUUID();
    const toast: Toast = { id, ...t };
    // auto-remove after timeout
    const ms = t.timeoutMs ?? 3000;
    if (ms > 0) {
      setTimeout(() => {
        set((state) => ({ toasts: state.toasts.filter((x) => x.id !== id) }));
      }, ms);
    }
    return { toasts: [...s.toasts, toast] };
  }),
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  clear: () => set({ toasts: [] }),
}));

export function useToast() {
  const add = useToastStore((s) => s.add);
  return {
    info: (message: string, timeoutMs?: number) => add({ kind: 'info', message, timeoutMs }),
    success: (message: string, timeoutMs?: number) => add({ kind: 'success', message, timeoutMs }),
    error: (message: string, timeoutMs?: number) => add({ kind: 'error', message, timeoutMs }),
  };
}
