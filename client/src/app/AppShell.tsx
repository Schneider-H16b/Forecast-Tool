import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import '../theme.css';
import { getHealth } from '../api/client';
import { useUIStore } from '../store/uiStore';
import { ToastContainer, StatusBadge, Button } from '../ui/components';

function useTheme() {
  const [dark, setDark] = useState(() => {
    const v = localStorage.getItem('theme');
    return v === 'dark';
  });
  useEffect(() => {
    const root = document.documentElement;
    if (dark) root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);
  return { dark, setDark };
}

function DBStatusBadge() {
  const [status, setStatus] = useState<'ok'|'warning'|'error'>('warning');
  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const h = await getHealth();
        if (!cancel) setStatus(h.ok ? 'ok' : 'error');
      } catch {
        if (!cancel) setStatus('error');
      }
    })();
    return () => { cancel = true; };
  }, []);
  
  const labels = {
    ok: 'Verbunden',
    warning: 'Verbinde…',
    error: 'Fehler'
  };
  
  return <StatusBadge status={status} label={labels[status]} />;
}

function TopBar() {
  const { dark, setDark } = useTheme();
  return (
    <div className="topbar">
      <div className="flex items-center gap-3">
        <img src="/logo-h16b.svg" alt="h16b" style={{ height: '40px', width: 'auto' }} />
        <div className="app-title">Smart Waste Forecast</div>
        <span className="text-xs px-2 py-1 rounded bg-h16b-accent/20 text-h16b-accent font-semibold">v7</span>
      </div>
      <div className="flex gap-3 items-center">
        <DBStatusBadge/>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setDark(!dark)}
        >
          {dark ? '☀️ Light' : '🌙 Dark'}
        </Button>
      </div>
    </div>
  );
}

const tabs = [
  { to: '/forecast', label: 'Forecast' },
  { to: '/production', label: 'Fertigung' },
  { to: '/montage', label: 'Montage' },
  { to: '/sales', label: 'Vertrieb' },
  { to: '/kpis', label: 'KPIs' },
  { to: '/settings', label: 'Settings' },
];

function TabsNav() {
  return (
    <div className="tabs">
      {tabs.map(t => (
        <NavLink key={t.to} to={t.to} className={({isActive})=>`tab ${isActive?'active':''}`}>
          {t.label}
        </NavLink>
      ))}
    </div>
  );
}


function MonthToolbar() {
  const { pathname } = useLocation();
  const show = useMemo(()=> ['/forecast','/production','/montage','/kpis'].some(p=>pathname.startsWith(p)),[pathname]);
  const monthStart = useUIStore(s=>s.currentMonth);
  const setMonth = useUIStore(s=>s.setMonth);
  if (!show) return null;
  const d = new Date(monthStart + 'T00:00:00Z');
  const label = d.toLocaleString('de-DE',{month:'long',year:'numeric'});
  function addMonths(n:number){
    const nd = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth()+n, 1));
    setMonth(nd.toISOString().slice(0,10));
  }
  function setToday(){
    const now = new Date();
    const nd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    setMonth(nd.toISOString().slice(0,10));
  }
  return (
    <div className="subtoolbar">
      <Button size="sm" variant="ghost" onClick={()=>addMonths(-1)}>◀ Vorher</Button>
      <div className="flex-1 text-center font-semibold text-fg-primary">{label}</div>
      <Button size="sm" variant="ghost" onClick={()=>addMonths(1)}>Nachher ▶</Button>
      <Button size="sm" variant="primary" onClick={setToday}>Heute</Button>
    </div>
  );
}


export default function AppShell() {
  return (
    <div className="container">
      <TopBar/>
      <TabsNav/>
      <MonthToolbar/>
      <ToastContainer/>
      <Outlet/>
    </div>
  );
}
