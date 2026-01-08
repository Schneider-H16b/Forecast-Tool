import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppShell from '../src/app/AppShell';

describe('App shell', () => {
  it('renders header and tabs', async () => {
    const qc = new QueryClient();
    const router = createMemoryRouter([
      {
        element: <AppShell />,
        children: [
          { path: '/forecast', element: <div>Forecast Page</div> },
        ],
      },
    ], {
      initialEntries: ['/forecast'],
      future: { v7_startTransition: true, v7_relativeSplatPath: true } as any,
    });
    render(
      <QueryClientProvider client={qc}>
        <RouterProvider router={router} future={{ v7_startTransition: true, v7_relativeSplatPath: true } as any} />
      </QueryClientProvider>
    );
    expect(await screen.findByText(/Smart Waste Forecast/i)).toBeTruthy();
    expect(screen.getByText(/v7/i)).toBeTruthy();
    expect(screen.getByText('Forecast')).toBeTruthy();
  });
});
