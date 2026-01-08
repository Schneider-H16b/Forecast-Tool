import React from 'react';
import { createRoot } from 'react-dom/client';
import { Navigate, createBrowserRouter, RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppShell from './app/AppShell';
import Forecast from './routes/Forecast';
import Production from './routes/Production';
import Montage from './routes/Montage';
import Sales from './routes/Sales';
import KPIs from './routes/KPIs';
import BI from './routes/BI';
import Settings from './routes/Settings';
import './theme.css';

const qc = new QueryClient();

const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/forecast" replace /> },
      { path: '/forecast', element: <Forecast /> },
      { path: '/production', element: <Production /> },
      { path: '/montage', element: <Montage /> },
      { path: '/sales', element: <Sales /> },
      { path: '/kpis', element: <KPIs /> },
      { path: '/bi', element: <BI /> },
      { path: '/settings', element: <Settings /> },
    ],
  },
], {
  // future flags to align with upcoming React Router v7 behaviors
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
  },
} as any);

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={qc}>
      <RouterProvider router={router} future={{ v7_startTransition: true, v7_relativeSplatPath: true } as any} />
    </QueryClientProvider>
  </React.StrictMode>
);
