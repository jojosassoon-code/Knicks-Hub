'use client';

import { useEffect, useState } from 'react';

function compute(tipoffAt: string): string | null {
  const diffMs = new Date(tipoffAt).getTime() - Date.now();
  if (diffMs <= 0) return null;
  const h = Math.floor(diffMs / 3_600_000);
  const m = Math.floor((diffMs % 3_600_000) / 60_000);
  if (h >= 48) return null; // more than 2 days out — skip countdown
  if (h >= 1) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return 'Starting soon';
}

export default function CountdownTimer({ tipoffAt }: { tipoffAt: string }) {
  const [label, setLabel] = useState<string | null>(() => compute(tipoffAt));

  useEffect(() => {
    // Align to the next minute boundary for efficiency
    const tick = () => setLabel(compute(tipoffAt));
    const msToNextMinute = 60_000 - (Date.now() % 60_000);
    const initial = setTimeout(() => {
      tick();
      const interval = setInterval(tick, 60_000);
      return () => clearInterval(interval);
    }, msToNextMinute);

    return () => clearTimeout(initial);
  }, [tipoffAt]);

  if (!label) return null;

  return (
    <span
      style={{
        fontFamily: 'DM Sans, sans-serif',
        fontSize: '0.82rem',
        fontWeight: 600,
        color: '#F58426',
        letterSpacing: '0.04em',
      }}
    >
      Tip-off in {label}
    </span>
  );
}
