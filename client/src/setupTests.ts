import { vi } from 'vitest';

// Global fetch stub for tests (DB/health calls)
vi.stubGlobal('fetch', vi.fn(() =>
  Promise.resolve({ ok: true, json: async () => ({ ok: true }) }) as unknown as Promise<Response>
));

// Cleanup after test run
vi.mocked(fetch).mockClear();
