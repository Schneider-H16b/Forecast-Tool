import React, { useEffect, useState } from 'react';

function App() {
  const [apiOk, setApiOk] = useState<boolean | null>(null);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch('/health');
        if (!res.ok) throw new Error('network');
        const data = await res.json();
        setApiOk(Boolean(data?.ok));
      } catch (e) {
        setApiOk(false);
      }
    };
    check();
  }, []);

  return (
    <div style={{fontFamily: 'system-ui, sans-serif', padding: 20}}>
      <h1>Forecast Tool</h1>
      <p>
        API Status:{' '}
        {apiOk === null ? 'Checking...' : apiOk ? '✅ API OK' : '❌ API unreachable'}
      </p>
    </div>
  );
}

export default App;
