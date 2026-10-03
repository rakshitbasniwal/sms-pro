export default function StatCard({ icon, label, value, colorClass = 'blue', change, changeType }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${colorClass}`}>{icon}</div>
      <div className="stat-info">
        <h3>{value ?? '—'}</h3>
        <p>{label}</p>
        {change !== undefined && (
          <div className={`stat-change ${changeType === 'up' ? 'up' : 'down'}`}>
            {changeType === 'up' ? '↑' : '↓'} {change}
          </div>
        )}
      </div>
    </div>
  );
}
