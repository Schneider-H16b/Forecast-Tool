import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import '../theme.css';
import { getHealth } from '../api/client';
import { useUIStore } from '../store/uiStore';
import { ToastContainer } from '../ui/components/Toast';

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
  const [status, setStatus] = useState<'unknown'|'ok'|'error'>('unknown');
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
  return (
    <span className="badge" title="DB/Server Status">
      {status === 'ok' && <span className="status-ok">●</span>}
      {status === 'error' && <span className="status-err">●</span>}
      {status === 'unknown' && <span className="status-warn">●</span>}
      <span>{status === 'ok' ? 'DB verbunden' : status === 'error' ? 'DB Fehler' : 'Prüfe…'}</span>
    </span>
  );
}

function TopBar() {
  const { dark, setDark } = useTheme();
  return (
    <div className="topbar">
      <div className="app-title">Kapa-Planung • v7</div>
      <div style={{display:'flex',gap:8,alignItems:'center'}}>
        <DBStatusBadge/>
        <button className="btn" onClick={()=>setDark(!dark)}>{dark ? 'Light' : 'Dark'}</button>
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
  const label = d.toLocaleString(undefined,{month:'long',year:'numeric'});
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
      <button className="btn" onClick={()=>addMonths(-1)}>◀ Prev</button>
      <div style={{minWidth:140,textAlign:'center'}}>{label}</div>
      <button className="btn" onClick={()=>addMonths(1)}>Next ▶</button>
      <button className="btn" onClick={setToday}>Heute</button>
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
