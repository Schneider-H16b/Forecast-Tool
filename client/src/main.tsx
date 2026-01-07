import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppShell from './app/AppShell';
import Forecast from './routes/Forecast';
import Production from './routes/Production';
import Montage from './routes/Montage';
import Sales from './routes/Sales';
import KPIs from './routes/KPIs';
import Settings from './routes/Settings';
import './theme.css';

const qc = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}> 
            <Route index element={<Navigate to="/forecast" replace />} />
            <Route path="/forecast" element={<Forecast />} />
            <Route path="/production" element={<Production />} />
            <Route path="/montage" element={<Montage />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/kpis" element={<KPIs />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
