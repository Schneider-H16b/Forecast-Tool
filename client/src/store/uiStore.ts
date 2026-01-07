import { create } from 'zustand';

export type Selection =
  | { type: 'none' }
  | { type: 'order'; id: string }
  | { type: 'event'; id: string }
  | { type: 'day'; date: string };

type SortKey = 'id'|'customer'|'forecast'|'sum'|'status';

interface UIState {
  currentMonth: string; // YYYY-MM-01
  selection: Selection;
  modal: { type: 'none' }
    | { type: 'positions'; orderId: string }
    | { type: 'assignment'; orderId: string; kind: 'production'|'montage'; date?: string }
    | { type: 'editEvent'; event: { id: string; kind: 'production'|'montage'; order_id: string; start_date: string; end_date: string; total_minutes: number; travel_minutes: number; employeeIds?: string[] } }
    | { type: 'autoplanResult'; result: unknown };
  // Forecast filters
  forecast: {
    search?: string;
    statuses: string[]; // e.g., ['open','delivered','canceled']
    onlyDelayed: boolean;
    onlyUnplanned: boolean;
    sort: { key: SortKey; dir: 'asc'|'desc' };
  };
  setMonth: (iso: string) => void;
  setSelection: (sel: Selection) => void;
  openModal: (m: UIState['modal']) => void;
  closeModal: () => void;
  setForecast: (partial: Partial<UIState['forecast']>) => void;
}

function toMonthStartISO(d = new Date()) {
  const dt = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
  return dt.toISOString().slice(0, 10);
}

export const useUIStore = create<UIState>((set) => ({
  currentMonth: toMonthStartISO(),
  selection: { type: 'none' },
  modal: { type: 'none' },
  forecast: {
    search: '',
    statuses: ['open'],
    onlyDelayed: false,
    onlyUnplanned: false,
    sort: { key: 'forecast', dir: 'asc' },
  },
  setMonth: (iso) => set({ currentMonth: iso }),
  setSelection: (selection) => set({ selection }),
  openModal: (m) => set({ modal: m }),
  closeModal: () => set({ modal: { type: 'none' } }),
  setForecast: (partial) => set((s) => ({ forecast: { ...s.forecast, ...partial } })),
}));
