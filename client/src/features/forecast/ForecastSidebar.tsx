import React, { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useUIStore } from '../../store/uiStore';
import { importCsv, importDualCsv } from '../../api/import';
import { useToast } from '../../store/toastStore';
import { runAutoPlan } from '../../api/autoplan';
import { downloadExportedOrders, type ExportFormat } from '../../api/export';
import { Button, Card, CardHeader, CardBody, Badge } from '../../ui/components';

export default function ForecastSidebar() {
  const f = useUIStore(s=>s.forecast);
  const currentMonth = useUIStore(s=>s.currentMonth);
  const setF = useUIStore(s=>s.setForecast);
  const toast = useToast();
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const headerInputRef = useRef<HTMLInputElement>(null);
  const positionsInputRef = useRef<HTMLInputElement>(null);
  const [headerCsvText, setHeaderCsvText] = useState<string | undefined>(undefined);
  const [positionsCsvText, setPositionsCsvText] = useState<string | undefined>(undefined);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');

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
      toast.success(`✓ Importiert: ${data.imported} Orders, ${data.skipped} übersprungen`);
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (e: Error) => {
      toast.error(`✕ Import fehlgeschlagen: ${e.message}`);
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
    <div className="flex flex-col gap-4">
      {/* Search Card */}
      <Card>
        <CardHeader>🔍 Suche</CardHeader>
        <CardBody>
          <input
            type="text"
            placeholder="Kunde / Auftrag / SKU"
            value={f.search ?? ''}
            onChange={(e)=>setF({ search: e.target.value })}
            className="w-full"
          />
        </CardBody>
      </Card>

      {/* Filter Card */}
      <Card>
        <CardHeader>⚙️ Filter</CardHeader>
        <CardBody>
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={f.statuses.includes('open')}
                onChange={()=>toggleStatus('open')}
                className="w-4 h-4"
              />
              <span className="text-sm">Offen</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={f.statuses.includes('delivered')}
                onChange={()=>toggleStatus('delivered')}
                className="w-4 h-4"
              />
              <span className="text-sm">Abgeschlossen</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={f.statuses.includes('canceled')}
                onChange={()=>toggleStatus('canceled')}
                className="w-4 h-4"
              />
              <span className="text-sm">Storniert</span>
            </label>
            <hr className="my-2 border-border-light" />
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={f.onlyDelayed}
                onChange={(e)=>setF({ onlyDelayed: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm">⚠ Nur Verzug</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={f.onlyUnplanned}
                onChange={(e)=>setF({ onlyUnplanned: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm">Nur ohne Planung</span>
            </label>
          </div>
        </CardBody>
      </Card>

      {/* Time Period Card */}
      <Card>
        <CardHeader>📅 Zeitraum</CardHeader>
        <CardBody>
          <Badge variant="info">Dieser Monat</Badge>
        </CardBody>
      </Card>

      {/* Import Card */}
      <Card>
        <CardHeader>📤 CSV-Import</CardHeader>
        <CardBody className="flex flex-col gap-3">
          <div>
            <label className="label text-xs font-medium">Header: auftrag.csv</label>
            <input ref={headerInputRef} type="file" accept=".csv" onChange={handleHeaderChange} className="text-sm" />
          </div>
          <div>
            <label className="label text-xs font-medium">Positionen: auftrag_offene_positionen.csv</label>
            <input ref={positionsInputRef} type="file" accept=".csv" onChange={handlePositionsChange} className="text-sm" />
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={triggerDualImport}
            disabled={importMutation.isPending || (!headerCsvText && !positionsCsvText)}
            isLoading={importMutation.isPending}
          >
            Dual-Import starten
          </Button>
          <hr className="border-border-light" />
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={importMutation.isPending}
            isLoading={importMutation.isPending}
          >
            Einzelnes CSV importieren
          </Button>
        </CardBody>
      </Card>

      {/* AutoPlan Card */}
      <Card>
        <CardHeader>🤖 AutoPlan</CardHeader>
        <CardBody>
          <Button
            variant="primary"
            size="sm"
            className="w-full"
            onClick={async ()=>{
              const today = new Date();
              const startDate = today.toISOString().slice(0,10);
              const end = new Date(); end.setDate(today.getDate()+30);
              const endDate = end.toISOString().slice(0,10);
              try {
                const res = await runAutoPlan({ startDate, endDate, includeProduction: true, includeMontage: true, overwriteExisting: false });
                toast.success(`✓ AutoPlan: ${res.createdEvents} Events, ${res.issues?.length ?? 0} Hinweise`);
              } catch(e:any) {
                toast.error(`✕ AutoPlan fehlgeschlagen: ${e.message ?? e}`);
              }
            }}
          >
            AutoPlan (alle)
          </Button>
        </CardBody>
      </Card>

      {/* Export Card */}
      <Card>
        <CardHeader>📥 Exportieren</CardHeader>
        <CardBody className="flex flex-col gap-3">
          <div>
            <label className="label text-xs font-medium">Format</label>
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
              className="w-full"
            >
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
            </select>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={async ()=>{
              try {
                const from = currentMonth;
                const d = new Date(currentMonth + 'T00:00:00Z');
                const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0));
                const to = end.toISOString().slice(0,10);
                await downloadExportedOrders(exportFormat, { from, to, statuses: f.statuses.length > 0 ? f.statuses : undefined });
                toast.success(`✓ Export als ${exportFormat.toUpperCase()} gestartet`);
              } catch(e:any) {
                toast.error(`✕ Export fehlgeschlagen: ${e.message ?? e}`);
              }
            }}
          >
            Orders exportieren
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={()=>{ const base = (window as any).__API_BASE__ || ''; window.open(`${base}/api/db/export`, '_blank'); }}
          >
            DB exportieren
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
