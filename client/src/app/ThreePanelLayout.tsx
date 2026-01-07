import React, { PropsWithChildren } from 'react';
import '../theme.css';

export function ThreePanelLayout({
  sidebar,
  inspector,
  children,
}: PropsWithChildren<{ sidebar?: React.ReactNode; inspector?: React.ReactNode }>) {
  return (
    <div className="layout">
      <aside className="sidebar">{sidebar || <em>Sidebar</em>}</aside>
      <main className="center">{children}</main>
      <aside className="inspector">{inspector || <em>Inspector</em>}</aside>
    </div>
  );
}
