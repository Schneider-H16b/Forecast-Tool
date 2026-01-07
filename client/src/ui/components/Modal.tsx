import React, { PropsWithChildren } from 'react';

export default function Modal({ open, title, onClose, children }:{ open: boolean; title: string; onClose: ()=>void } & PropsWithChildren){
  if (!open) return null;
  return (
    <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.35)', display:'grid', placeItems:'center', zIndex:1000}} onClick={onClose}>
      <div style={{minWidth:480, maxWidth:720, background:'var(--bg)', color:'var(--fg)', border:'1px solid var(--border)', borderRadius:8, padding:12}} onClick={e=>e.stopPropagation()}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
          <h3 style={{margin:0}}>{title}</h3>
          <button className="btn" onClick={onClose}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
