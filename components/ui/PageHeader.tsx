import MetadataRow from '@/components/ui/MetadataRow';

type PageHeaderProps = {
  title: string;
  eyebrow?: string;
  metadata?: string[];
};

export default function PageHeader({ title, eyebrow, metadata = [] }: PageHeaderProps) {
  return (
    <div className="section-label">
      <div className="space-y-2">
        {eyebrow && (
          <p
            className="text-xs font-semibold tracking-widest"
            style={{ color: '#F58426', letterSpacing: '0.18em' }}
          >
            {eyebrow}
          </p>
        )}
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.2rem, 6vw, 3.5rem)',
            color: '#FFFFFF',
            letterSpacing: '0.06em',
            lineHeight: 1,
          }}
        >
          {title}
        </h1>
        {metadata.length > 0 && <MetadataRow items={metadata} />}
      </div>
    </div>
  );
}
