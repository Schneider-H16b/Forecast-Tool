import React from 'react';
import { ThreePanelLayout } from '../app/ThreePanelLayout';

export default function Sales() {
  return (
    <ThreePanelLayout
      sidebar={<div>
        <h3>Filter</h3>
        <p>Kunde / Region</p>
      </div>}
      inspector={<div>
        <h3>Order</h3>
        <p>Details</p>
      </div>}
    >
      <div className="kpi-card">Offene Aufträge nach Forecast-Woche</div>
    </ThreePanelLayout>
  );
}
