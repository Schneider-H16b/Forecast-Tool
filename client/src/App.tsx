import React from 'react';
import { Outlet } from 'react-router-dom';
import AppShell from './app/AppShell';
import { ThreePanelLayout } from './app/ThreePanelLayout';

export default function App() {
  // AppShell renders TopBar, Tabs, MonthToolbar; routes render content via Outlet
  return (
    <AppShell>
      <ThreePanelLayout>
        <Outlet />
      </ThreePanelLayout>
    </AppShell>
  );
}
