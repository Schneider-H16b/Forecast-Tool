import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import AppShell from '../src/app/AppShell';

describe('App shell', () => {
  it('renders header and tabs', async () => {
    render(
      <MemoryRouter initialEntries={["/forecast"]}>
        <AppShell />
      </MemoryRouter>
    );
    expect(await screen.findByText(/Kapa-Planung • v7/i)).toBeTruthy();
    expect(screen.getByText('Forecast')).toBeTruthy();
  });
});
