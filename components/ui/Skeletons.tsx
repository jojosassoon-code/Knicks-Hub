import type { CSSProperties } from 'react';

function SkeletonBlock({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return <div className={`skeleton-block ${className ?? ''}`.trim()} style={style} />;
}

export function PageHeaderSkeleton() {
  return (
    <div className="space-y-3">
      <SkeletonBlock style={{ width: '7rem', height: '0.75rem' }} />
      <SkeletonBlock style={{ width: '16rem', height: '2.5rem' }} />
      <SkeletonBlock style={{ width: '20rem', height: '0.95rem' }} />
    </div>
  );
}

export function HomePageSkeleton() {
  return (
    <div className="space-y-10">
      <div className="card rounded-3xl p-8 sm:p-12">
        <div className="space-y-4">
          <SkeletonBlock style={{ width: '8rem', height: '0.8rem' }} />
          <SkeletonBlock style={{ width: '18rem', height: '5rem' }} />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonBlock key={index} style={{ height: '5.5rem' }} />
            ))}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <SkeletonBlock key={index} style={{ height: '10rem' }} />
        ))}
      </div>
    </div>
  );
}

export function StandingsSkeleton() {
  return (
    <div className="space-y-8">
      <PageHeaderSkeleton />
      <SkeletonBlock style={{ height: '32rem' }} />
    </div>
  );
}

export function ScheduleSkeleton() {
  return (
    <div className="space-y-8">
      <PageHeaderSkeleton />
      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_1fr] gap-6">
        <SkeletonBlock style={{ height: '28rem' }} />
        <SkeletonBlock style={{ height: '28rem' }} />
      </div>
    </div>
  );
}
