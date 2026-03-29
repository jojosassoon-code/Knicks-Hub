import type { ReactNode } from 'react';

type StatCardProps = {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  accent?: string;
};

export default function StatCard({
  label,
  value,
  detail,
  accent = '#F58426',
}: StatCardProps) {
  return (
    <div className="card rounded-2xl p-6">
      <p
        className="text-xs font-semibold tracking-widest mb-3"
        style={{ color: accent, fontFamily: 'var(--font-body)', letterSpacing: '0.18em' }}
      >
        {label}
      </p>
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(1.8rem, 5vw, 3rem)',
          color: '#FFFFFF',
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      {detail && (
        <div className="mt-2 text-sm" style={{ color: '#8899AA' }}>
          {detail}
        </div>
      )}
    </div>
  );
}
