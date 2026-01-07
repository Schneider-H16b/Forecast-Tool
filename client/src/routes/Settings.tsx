import React from 'react';
import { ThreePanelLayout } from '../app/ThreePanelLayout';

export default function Settings() {
  return (
    <ThreePanelLayout
      sidebar={<div>
        <h3>Settings</h3>
        <ul>
          <li>Global Params</li>
          <li>Items</li>
          <li>Employees</li>
          <li>Blockers</li>
          <li>Import/DB</li>
        </ul>
      </div>}
      inspector={<div>
        <h3>Details</h3>
      </div>}
    >
      <div className="kpi-card">Settings Editor (später)</div>
    </ThreePanelLayout>
  );
}
