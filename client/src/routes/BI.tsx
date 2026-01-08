import React, { useEffect, useMemo, useState } from 'react';
import { ResponsiveGridLayout, Layout } from 'react-grid-layout';
import { ResponsiveLine } from '@nivo/line';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveBullet } from '@nivo/bullet';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { Card, CardHeader, CardBody, Button, KPICard, Table, type TableColumn, FormGroup, Input, Select, Badge } from '../ui/components';
import { fetchBiDashboard, saveBiDashboard } from '../api/bi';

interface Widget {
  id: string;
  title: string;
  type: 'kpi' | 'bullet' | 'line' | 'bar' | 'donut' | 'table';
  layout: Layout;
}

const baseWidgets: Widget[] = [
  { id: 'kpi-open', title: 'Open Orders', type: 'kpi', layout: { i: 'kpi-open', x: 0, y: 0, w: 3, h: 2 } },
  { id: 'kpi-otd', title: 'On-Time Delivery', type: 'kpi', layout: { i: 'kpi-otd', x: 3, y: 0, w: 3, h: 2 } },
  { id: 'bullet-capacity', title: 'Capacity vs Target', type: 'bullet', layout: { i: 'bullet-capacity', x: 6, y: 0, w: 3, h: 2 } },
  { id: 'donut-orders', title: 'Orders Status Split', type: 'donut', layout: { i: 'donut-orders', x: 9, y: 0, w: 3, h: 2 } },
  { id: 'line-orders', title: 'Orders over Time', type: 'line', layout: { i: 'line-orders', x: 0, y: 2, w: 6, h: 3 } },
  { id: 'bar-capacity', title: 'Capacity by Area', type: 'bar', layout: { i: 'bar-capacity', x: 6, y: 2, w: 6, h: 3 } },
  { id: 'table-top', title: 'Top Items', type: 'table', layout: { i: 'table-top', x: 0, y: 5, w: 12, h: 3 } },
];

const mockData = {
  kpis: {
    openOrders: 21,
    onTimeDelivery: 88,
    capacityUtilization: 72,
    capacityTarget: 85,
  },
  ordersSplit: [
    { id: 'Offen', label: 'Offen', value: 21 },
    { id: 'Geliefert', label: 'Geliefert', value: 9 },
    { id: 'In Arbeit', label: 'In Arbeit', value: 6 },
  ],
  lineSeries: [
    {
      id: 'Orders offen',
      data: [
        { x: 'KW1', y: 18 },
        { x: 'KW2', y: 20 },
        { x: 'KW3', y: 21 },
        { x: 'KW4', y: 24 },
      ],
    },
    {
      id: 'Orders geliefert',
      data: [
        { x: 'KW1', y: 8 },
        { x: 'KW2', y: 10 },
        { x: 'KW3', y: 12 },
        { x: 'KW4', y: 15 },
      ],
    },
  ],
  barData: [
    { segment: 'Production', offen: 12, geliefert: 6 },
    { segment: 'Montage', offen: 9, geliefert: 5 },
    { segment: 'Other', offen: 5, geliefert: 4 },
  ],
  table: [
    { id: 'SKU-100', name: 'Artikel Alpha', open: 12, delivered: 4, capacity: 78 },
    { id: 'SKU-200', name: 'Artikel Bravo', open: 9, delivered: 3, capacity: 64 },
    { id: 'SKU-300', name: 'Artikel Charlie', open: 7, delivered: 5, capacity: 81 },
    { id: 'SKU-400', name: 'Artikel Delta', open: 5, delivered: 2, capacity: 55 },
  ],
};

function cloneLayouts(layout: Layout[]) {
  return {
    lg: layout.map(l => ({ ...l })),
    md: layout.map(l => ({ ...l, w: Math.min(l.w, 8) })),
    sm: layout.map(l => ({ ...l, w: Math.min(l.w, 6) })),
    xs: layout.map(l => ({ ...l, w: Math.min(l.w, 4) })),
    xxs: layout.map(l => ({ ...l, w: Math.min(l.w, 2) })),
  };
}

function WidgetFrame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <h4 style={{ margin: 0 }}>{title}</h4>
      </CardHeader>
      <CardBody className="h-full">
        {children}
      </CardBody>
    </Card>
  );
}

export default function BI() {
  const [showAdd, setShowAdd] = useState(false);
  const [draft, setDraft] = useState({ title: 'Neues Widget', type: 'kpi', metric: 'orders.open' });
  const [widgets, setWidgets] = useState<Widget[]>(baseWidgets);
  const [layouts, setLayouts] = useState<any>(cloneLayouts(baseWidgets.map(w => w.layout)));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const cfg = await fetchBiDashboard();
        if (cfg && cfg.widgets?.length && cfg.layouts) {
          setWidgets(cfg.widgets);
          setLayouts(cfg.layouts);
        }
      } catch (e) {
        setError('BI Config laden fehlgeschlagen');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const tableColumns: TableColumn<(typeof mockData.table)[number]>[] = [
    { key: 'id', header: 'SKU' },
    { key: 'name', header: 'Name' },
    { key: 'open', header: 'Offen', render: (v) => <span className="font-semibold">{v}</span> },
    { key: 'delivered', header: 'Geliefert' },
    {
      key: 'capacity',
      header: 'Kapazitätsnutzung',
      render: (v: number) => (
        <div className="flex items-center gap-2">
          <div className="w-20 bg-bg-tertiary rounded-full h-2 overflow-hidden">
            <div className="h-full bg-h16b-accent" style={{ width: `${Math.min(100, v)}%` }} />
          </div>
          <span className="text-xs text-fg-secondary">{v}%</span>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 style={{ margin: 0 }}>BI Dashboard (Mock)</h2>
          <p className="text-sm text-fg-secondary" style={{ margin: 0 }}>Drag/Resize Widgets – Daten aktuell mit Mock befüllt, API folgt.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setShowAdd(true)}>Widget hinzufügen</Button>
          <Button variant="ghost" onClick={() => window.location.reload()}>Layout zurücksetzen</Button>
          <Button onClick={async () => { await saveBiDashboard({ widgets, layouts }); }}>Speichern</Button>
        </div>
      </div>

      {loading && <Badge variant="info">Lade BI-Konfiguration…</Badge>}
      {error && <Badge variant="error">{error}</Badge>}
      <ResponsiveGridLayout
        className="layout"
        rowHeight={120}
        layouts={layouts}
        cols={{ lg: 12, md: 10, sm: 8, xs: 6, xxs: 4 }}
        margin={[16, 16]}
        isResizable
        isDraggable
        compactType="vertical"
        isBounded
        preventCollision
        draggableHandle=".card-header"
      >
        {widgets.map((widget) => (
          <div key={widget.id} data-grid={widget.layout}>
            {widget.type === 'kpi' && (
              <WidgetFrame title={widget.title}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <KPICard
                    value={mockData.kpis.openOrders}
                    label="Open Orders"
                    trend="up"
                    trendValue="+12% vs Vormonat"
                  />
                  <KPICard
                    value={`${mockData.kpis.onTimeDelivery}%`}
                    label="On-Time Delivery"
                    trend="up"
                    trendValue="+4 pp"
                  />
                </div>
              </WidgetFrame>
            )}

            {widget.type === 'bullet' && (
              <WidgetFrame title={widget.title}>
                <div style={{ height: 200 }}>
                  <ResponsiveBullet
                    data={[{
                      id: 'Capacity',
                      title: 'Capacity',
                      ranges: [60, 85, 100],
                      measures: [mockData.kpis.capacityUtilization],
                      markers: [mockData.kpis.capacityTarget],
                    }]}
                    colors={{ scheme: 'reds' }}
                    margin={{ top: 10, right: 40, bottom: 30, left: 80 }}
                    spacing={40}
                    markerColors={['#ed1c24']}
                    theme={{ text: { fill: 'var(--fg-primary)' }, labels: { text: { fill: 'var(--fg-primary)' } } }}
                  />
                </div>
              </WidgetFrame>
            )}

            {widget.type === 'donut' && (
              <WidgetFrame title={widget.title}>
                <div style={{ height: 240 }}>
                  <ResponsivePie
                    data={mockData.ordersSplit}
                    innerRadius={0.6}
                    padAngle={1}
                    cornerRadius={4}
                    colors={{ scheme: 'paired' }}
                    margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
                    activeOuterRadiusOffset={8}
                    legends={[]}
                    theme={{ text: { fill: 'var(--fg-primary)' } }}
                  />
                </div>
              </WidgetFrame>
            )}

            {widget.type === 'line' && (
              <WidgetFrame title={widget.title}>
                <div style={{ height: 260 }}>
                  <ResponsiveLine
                    data={mockData.lineSeries}
                    margin={{ top: 20, right: 20, bottom: 40, left: 50 }}
                    xScale={{ type: 'point' }}
                    yScale={{ type: 'linear', min: 0, max: 'auto' }}
                    axisBottom={{ tickPadding: 8, tickRotation: 0 }}
                    axisLeft={{ tickPadding: 8, tickRotation: 0 }}
                    curve="monotoneX"
                    colors={{ scheme: 'set1' }}
                    enablePoints={true}
                    pointSize={8}
                    enableArea={false}
                    useMesh
                    theme={{ textColor: 'var(--fg-primary)', axis: { ticks: { text: { fill: 'var(--fg-primary)' } } }, grid: { line: { stroke: 'var(--border-light)' } } }}
                  />
                </div>
              </WidgetFrame>
            )}

            {widget.type === 'bar' && (
              <WidgetFrame title={widget.title}>
                <div style={{ height: 260 }}>
                  <ResponsiveBar
                    data={mockData.barData}
                    keys={['offen', 'geliefert']}
                    indexBy="segment"
                    margin={{ top: 10, right: 20, bottom: 40, left: 50 }}
                    padding={0.2}
                    groupMode="grouped"
                    colors={{ scheme: 'accent' }}
                    axisBottom={{ tickPadding: 8, tickRotation: 0 }}
                    axisLeft={{ tickPadding: 8, tickRotation: 0 }}
                    labelSkipWidth={12}
                    labelSkipHeight={12}
                    theme={{ textColor: 'var(--fg-primary)', axis: { ticks: { text: { fill: 'var(--fg-primary)' } } }, grid: { line: { stroke: 'var(--border-light)' } } }}
                  />
                </div>
              </WidgetFrame>
            )}

            {widget.type === 'table' && (
              <WidgetFrame title={widget.title}>
                <Table data={mockData.table} columns={tableColumns} keyFn={(row) => row.id} />
              </WidgetFrame>
            )}
          </div>
        ))}
      </ResponsiveGridLayout>

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <Card style={{ width: 480 }}>
            <CardHeader className="flex justify-between items-start">
              <h4 style={{ margin: 0 }}>Widget hinzufügen (Mock)</h4>
              <Button variant="ghost" onClick={() => setShowAdd(false)}>Schließen</Button>
            </CardHeader>
            <CardBody className="flex flex-col gap-4">
              <FormGroup label="Titel">
                <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
              </FormGroup>
              <FormGroup label="Typ">
                <Select value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value })}>
                  <option value="kpi">KPI</option>
                  <option value="bullet">Bullet</option>
                  <option value="line">Linie</option>
                  <option value="bar">Balken</option>
                  <option value="donut">Donut/Treemap</option>
                  <option value="table">Tabelle</option>
                </Select>
              </FormGroup>
              <FormGroup label="Metrik (Mock Auswahl)">
                <Select value={draft.metric} onChange={(e) => setDraft({ ...draft, metric: e.target.value })}>
                  <option value="orders.open">Orders offen</option>
                  <option value="orders.delivered">Orders geliefert</option>
                  <option value="performance.otd">On-Time Delivery</option>
                  <option value="performance.capacity">Kapazitätsnutzung</option>
                </Select>
              </FormGroup>
              <div className="flex gap-3 justify-end pt-2">
                <Button variant="ghost" onClick={() => setShowAdd(false)}>Abbrechen</Button>
                <Button onClick={async () => { setShowAdd(false); /* extend later with real add */ }}>Hinzufügen (Mock)</Button>
              </div>
              <p className="text-xs text-fg-secondary" style={{ margin: 0 }}>
                Hinweis: Dies ist nur ein Mock-Dialog. In der nächsten Iteration speichern wir hier echte Widget-Configs und laden sie aus der DB.
              </p>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
