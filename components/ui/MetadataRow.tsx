type MetadataRowProps = {
  items: string[];
};

export default function MetadataRow({ items }: MetadataRowProps) {
  return (
    <div
      className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm"
      style={{ color: '#8899AA' }}
    >
      {items.filter(Boolean).map((item, index) => (
        <span key={`${item}-${index}`} className="flex items-center gap-3">
          {index > 0 && <span style={{ color: '#1E2D3D' }}>•</span>}
          <span>{item}</span>
        </span>
      ))}
    </div>
  );
}
