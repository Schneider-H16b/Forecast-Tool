import { render, screen, waitFor } from '@testing-library/react';
import App from '../src/App';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock global fetch so the component's effect doesn't trigger network errors during tests
beforeEach(() => {
  // @ts-ignore - vitest provides `vi`
  globalThis.fetch = vi.fn(() =>
    Promise.resolve({ ok: true, json: async () => ({ ok: true }) }) as unknown as Promise<Response>
  );
});

describe('App smoke', () => {
  it('renders title', async () => {
    render(<App />);
    expect(await screen.findByText(/Forecast Tool/i)).toBeTruthy();
    await waitFor(() => expect(screen.getByText(/API Status:/i)).toBeTruthy());
  });
});
