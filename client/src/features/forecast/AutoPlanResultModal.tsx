import Modal from '../../ui/components/Modal';
import { useUIStore } from '../../store/uiStore';
import type { AutoPlanResult } from '../../api/autoplan';

function parseJSON<T>(input?: string): T | undefined {
  if (!input) return undefined;
  try { return JSON.parse(input) as T; } catch { return undefined; }
}

const issueLabels: Record<string, string> = {
  insufficient_capacity: 'Kapazität fehlt',
  planning_error: 'Planungsfehler',
  no_employees: 'Keine Mitarbeiter',
};

const issueStyles: Record<string, React.CSSProperties> = {
  insufficient_capacity: { background: '#fff4e5', color: '#8a4b14' },
  planning_error: { background: '#ffe9e9', color: '#a11616' },
  no_employees: { background: '#eef2ff', color: '#283891' },
};

function IssueBadge({ type }: { type: string }) {
  const label = issueLabels[type] ?? type;
  const style = issueStyles[type];
  return <span className="badge" style={style}>{label}</span>;
}

function SummaryCards({ result }: { result: AutoPlanResult }) {
  const summary = parseJSON<{ createdEvents?: number; skippedOrders?: number; issueCount?: number }>(result.run?.summary_json);
  const items = [
    { label: 'Events erstellt', value: result.createdEvents ?? summary?.createdEvents },
    { label: 'Übersprungen', value: result.skippedOrders ?? summary?.skippedOrders },
    { label: 'Issues', value: summary?.issueCount ?? result.issues?.length },
  ].filter((c) => typeof c.value === 'number');
  const issueCounts = (result.issues ?? []).reduce<Record<string, number>>((acc, iss) => {
    acc[iss.type] = (acc[iss.type] ?? 0) + 1;
    return acc;
  }, {});
  const issueItems = Object.entries(issueCounts).map(([type, count]) => ({ label: issueLabels[type] ?? type, value: count }));
  if (items.length === 0 && issueItems.length === 0) return null;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 8, marginBottom: 12 }}>
      {items.map((c) => (
        <div key={c.label} className="kpi-card" style={{ padding: 10 }}>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>{c.label}</div>
          <div style={{ fontSize: 18 }}>{c.value}</div>
        </div>
      ))}
      {issueItems.map((c) => (
        <div key={c.label} className="kpi-card" style={{ padding: 10 }}>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>Issues: {c.label}</div>
          <div style={{ fontSize: 18 }}>{c.value}</div>
        </div>
      ))}
    </div>
  );
}

function ParamsRow({ result }: { result: AutoPlanResult }) {
  const params = parseJSON<{ startDate?: string; endDate?: string; includeProduction?: boolean; includeMontage?: boolean; overwriteExisting?: boolean }>(result.run?.params_json);
  if (!params) return null;
  return (
    <div className="kpi-card" style={{ padding: 10, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
      <div>
        <div style={{ fontSize: 12, color: 'var(--muted)' }}>Zeitraum</div>
        <div>{params.startDate} – {params.endDate}</div>
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: 12 }}>
        <span>{params.includeProduction === false ? 'Prod: aus' : 'Prod: an'}</span>
        <span>{params.includeMontage === false ? 'Montage: aus' : 'Montage: an'}</span>
        <span>{params.overwriteExisting ? 'Überschreiben: ja' : 'Überschreiben: nein'}</span>
      </div>
    </div>
  );
}

function IssuesList({ issues }: { issues?: AutoPlanResult['issues'] }) {
  if (!issues || issues.length === 0) return null;
  return (
    <div className="kpi-card" style={{ padding: 10, display: 'grid', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <div style={{ fontWeight: 600 }}>Issues</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <IssueBadge type="insufficient_capacity" />
          <IssueBadge type="planning_error" />
          <IssueBadge type="no_employees" />
        </div>
      </div>
      <div style={{ display: 'grid', gap: 6 }}>
        {issues.map((iss) => (
          <div key={iss.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 6, fontSize: 12 }}>
            <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <IssueBadge type={iss.type} />
            </span>
            <span>Order: {iss.order_id ?? 'n/a'}</span>
            <span>Datum: {iss.date_iso ?? 'n/a'}</span>
            <span>{iss.deficit_min ? `Defizit: ${iss.deficit_min}m` : ''}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AutoPlanResultModal({ result }: { result: AutoPlanResult }) {
  const close = useUIStore((s) => s.closeModal);
  return (
    <Modal open title="AutoPlan Ergebnis" onClose={close}>
      <SummaryCards result={result} />
      <ParamsRow result={result} />
      <IssuesList issues={result.issues} />
      <pre style={{ maxHeight: 320, overflow: 'auto', background: 'var(--bg-muted)', padding: 8, marginTop: 12 }}>
        {JSON.stringify(result, null, 2)}
      </pre>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
        <button onClick={close}>Schließen</button>
      </div>
    </Modal>
  );
}
