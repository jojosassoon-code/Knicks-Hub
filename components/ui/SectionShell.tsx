import type { ReactNode } from 'react';
import MetadataRow from '@/components/ui/MetadataRow';

type SectionShellProps = {
  title: string;
  subtitle?: string;
  metadata?: string[];
  children: ReactNode;
  className?: string;
};

export default function SectionShell({
  title,
  subtitle,
  metadata = [],
  children,
  className = '',
}: SectionShellProps) {
  return (
    <section className={className}>
      <div className="section-label mb-5">
        <div className="space-y-1.5">
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.4rem',
              color: '#FFFFFF',
              letterSpacing: '0.06em',
            }}
          >
            {title}
          </h2>
          {subtitle && <p style={{ color: '#8899AA', fontSize: '0.9rem' }}>{subtitle}</p>}
          {metadata.length > 0 && <MetadataRow items={metadata} />}
        </div>
      </div>
      {children}
    </section>
  );
}
