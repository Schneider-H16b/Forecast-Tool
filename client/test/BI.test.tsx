import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { describe, it, expect } from 'vitest';
import BI from '../src/routes/BI';

describe('BI dashboard (mock)', () => {
  it('renders core widgets', () => {
    const qc = new QueryClient();
    render(
      <QueryClientProvider client={qc}>
        <BI />
      </QueryClientProvider>
    );

    expect(screen.getByText(/BI Dashboard/i)).toBeTruthy();
    expect(screen.getAllByText(/Open Orders/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/On-Time Delivery/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Capacity vs Target/i)).toBeTruthy();
    expect(screen.getByText(/Orders Status Split/i)).toBeTruthy();
    expect(screen.getByText(/Widget hinzufügen/i)).toBeTruthy();
  });
});
