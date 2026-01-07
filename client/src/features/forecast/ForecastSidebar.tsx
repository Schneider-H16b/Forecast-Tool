import React, { useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useUIStore } from '../../store/uiStore';
import { importCsv } from '../../api/import';
import { useToast } from '../../store/toastStore';

export default function ForecastSidebar() {
  const f = useUIStore(s=>s.forecast);
  const setF = useUIStore(s=>s.setForecast);
  const toast = useToast();
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const importMutation = useMutation({
    mutationFn: async (csvText: string) => {
      return importCsv(csvText, 'forecast-ui');
    },
    onSuccess: (data) => {
      toast.success(`Importiert: ${data.imported} Orders, ${data.skipped} übersprungen`);
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (e: Error) => {
      toast.error(`Import fehlgeschlagen: ${e.message}`);
    },
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      if (text) importMutation.mutate(text);
    };
    reader.readAsText(file);
    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function toggleStatus(st: string){
    const has = f.statuses.includes(st);
    const next = has ? f.statuses.filter(x=>x!==st) : [...f.statuses, st];
    setF({ statuses: next });
  }
  return (
    <div style={{display:'grid', gap:12}}>
      <div>
        <h3>Suche</h3>
        <input
          placeholder="Kunde / Auftrag / SKU"
          value={f.search ?? ''}
          onChange={(e)=>setF({ search: e.target.value })}
          style={{width:'100%', padding:6}}
        />
      </div>
      <div>
        <h3>Filter</h3>
        <label style={{display:'block'}}>
          <input type="checkbox" checked={f.statuses.includes('open')} onChange={()=>toggleStatus('open')}/> Offen
        </label>
        <label style={{display:'block'}}>
          <input type="checkbox" checked={f.statuses.includes('delivered')} onChange={()=>toggleStatus('delivered')}/> Abgeschlossen
        </label>
        <label style={{display:'block'}}>
          <input type="checkbox" checked={f.statuses.includes('canceled')} onChange={()=>toggleStatus('canceled')}/> Storniert
        </label>
        <label style={{display:'block', marginTop:8}}>
          <input type="checkbox" checked={f.onlyDelayed} onChange={(e)=>setF({ onlyDelayed: e.target.checked })}/> ⚠ nur Verzug
        </label>
        <label style={{display:'block'}}>
          <input type="checkbox" checked={f.onlyUnplanned} onChange={(e)=>setF({ onlyUnplanned: e.target.checked })}/> nur ohne Planung
        </label>
      </div>
      <div>
        <h3>Zeitraum</h3>
        <div className="badge">Dieser Monat</div>
      </div>
      <div>
        <h3>Aktionen</h3>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <button className="btn" onClick={() => fileInputRef.current?.click()} disabled={importMutation.isPending}>
          {importMutation.isPending ? 'Importiere…' : 'CSV importieren'}
        </button>
        <div style={{height:6}}/>
        <button className="btn">AutoPlan (alle)</button>
        <div style={{height:6}}/>
        <button className="btn">DB exportieren</button>
      </div>
    </div>
  );
}
