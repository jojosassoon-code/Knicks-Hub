import type { ReactNode } from 'react';

type TableShellProps = {
  children: ReactNode;
};

export default function TableShell({ children }: TableShellProps) {
  return (
    <div className="card rounded-2xl overflow-hidden" style={{ padding: 0 }}>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}
