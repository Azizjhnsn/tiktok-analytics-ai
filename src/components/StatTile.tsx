interface StatTileProps {
  label: string;
  value: string | number;
}

export function StatTile({ label, value }: StatTileProps) {
  return (
    <div className="stat">
      <div className="stat-value">{value}</div>
      <div className="muted">{label}</div>
    </div>
  );
}
