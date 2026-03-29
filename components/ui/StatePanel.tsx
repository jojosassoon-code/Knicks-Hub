import type { ReactNode } from 'react';

type StatePanelProps = {
  title: string;
  body: ReactNode;
  variant?: 'error' | 'empty' | 'info';
};

const variantStyles = {
  error: {
    border: '1px solid rgba(255,61,61,0.3)',
    backgroundColor: 'rgba(15,25,35,0.9)',
    accent: '#FF3D3D',
  },
  empty: {
    border: '1px dashed rgba(245,132,38,0.3)',
    backgroundColor: 'rgba(15,25,35,0.8)',
    accent: '#F58426',
  },
  info: {
    border: '1px solid rgba(0,107,182,0.25)',
    backgroundColor: 'rgba(15,25,35,0.82)',
    accent: '#006BB6',
  },
} as const;

export default function StatePanel({
  title,
  body,
  variant = 'info',
}: StatePanelProps) {
  const style = variantStyles[variant];

  return (
    <div className="rounded-2xl p-8 text-center" style={style}>
      <p
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.4rem',
          color: '#FFFFFF',
          letterSpacing: '0.06em',
          marginBottom: '0.75rem',
        }}
      >
        {title}
      </p>
      <div style={{ color: '#8899AA', lineHeight: 1.6 }}>
        {body}
      </div>
      <div
        className="mx-auto mt-5 rounded-full"
        style={{ width: '3rem', height: '2px', backgroundColor: style.accent }}
      />
    </div>
  );
}
