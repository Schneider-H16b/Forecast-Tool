import { render, screen } from '@testing-library/react';
import App from '../src/App';
import { describe, it, expect } from 'vitest';

describe('App smoke', () => {
  it('renders title', () => {
    render(<App />);
    expect(screen.getByText(/Forecast Tool/i)).toBeTruthy();
  });
});
