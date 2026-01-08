import React, { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useUIStore } from '../../store/uiStore';
import { importCsv, importDualCsv } from '../../api/import';
import { useToast } from '../../store/toastStore';

export default function ForecastSidebar() {
  const f = useUIStore(s=>s.forecast);
  const setF = useUIStore(s=>s.setForecast);
  const toast = useToast();
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const headerInputRef = useRef<HTMLInputElement>(null);
  const positionsInputRef = useRef<HTMLInputElement>(null);
  const [headerCsvText, setHeaderCsvText] = useState<string | undefined>(undefined);
  const [positionsCsvText, setPositionsCsvText] = useState<string | undefined>(undefined);

  const importMutation = useMutation({
    mutationFn: async (payload: { csvText?: string; headerCsvText?: string; positionsCsvText?: string }) => {
      if (payload.headerCsvText || payload.positionsCsvText) {
        return importDualCsv({ headerCsvText: payload.headerCsvText, positionsCsvText: payload.positionsCsvText, source: 'forecast-ui' });
      }
      if (payload.csvText) {
        return importCsv(payload.csvText, 'forecast-ui');
      }
      throw new Error('No CSV provided');
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
      if (text) importMutation.mutate({ csvText: text });
    };
    reader.readAsText(file);
    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleHeaderChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) { setHeaderCsvText(undefined); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setHeaderCsvText(text || undefined);
    };
    reader.readAsText(file);
  }

  function handlePositionsChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) { setPositionsCsvText(undefined); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setPositionsCsvText(text || undefined);
    };
    reader.readAsText(file);
  }

  function triggerDualImport(){
    importMutation.mutate({ headerCsvText, positionsCsvText });
    // reset after triggering
    setHeaderCsvText(undefined);
    setPositionsCsvText(undefined);
    if (headerInputRef.current) headerInputRef.current.value = '';
    if (positionsInputRef.current) positionsInputRef.current.value = '';
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
        <div style={{display:'grid', gap:6}}>
          <label>Header: auftrag.csv</label>
          <input ref={headerInputRef} type="file" accept=".csv" onChange={handleHeaderChange} />
          <label>Positionen: auftrag_offene_positionen.csv</label>
          <input ref={positionsInputRef} type="file" accept=".csv" onChange={handlePositionsChange} />
          <button className="btn" onClick={triggerDualImport} disabled={importMutation.isPending || (!headerCsvText && !positionsCsvText)}>
            {importMutation.isPending ? 'Importiere…' : 'CSV laden'}
          </button>
        </div>
        <hr/>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <button className="btn" onClick={() => fileInputRef.current?.click()} disabled={importMutation.isPending}>
          {importMutation.isPending ? 'Importiere…' : 'CSV importieren (einzeln)'}
        </button>
        <div style={{height:6}}/>
        <button className="btn">AutoPlan (alle)</button>
        <div style={{height:6}}/>
        <button className="btn">DB exportieren</button>
      </div>
    </div>
  );
}
