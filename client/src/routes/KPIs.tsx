import React from 'react';
import { ThreePanelLayout } from '../app/ThreePanelLayout';

export default function KPIs() {
  return (
    <ThreePanelLayout
      sidebar={<div>
        <h3>Zeitraum/Granularität</h3>
        <p>Monat / Quartal</p>
      </div>}
      inspector={<div>
        <h3>Drilldown</h3>
        <p>Liste Orders/Events</p>
      </div>}
    >
      <div style={{display:'grid',gap:12}}>
        <div className="kpi-card">KPI Cards</div>
        <div className="kpi-card">Charts</div>
      </div>
    </ThreePanelLayout>
  );
}
