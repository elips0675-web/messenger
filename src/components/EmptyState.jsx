export default function EmptyState({ icon = '📂', message = 'Нет данных' }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <p>{message}</p>
    </div>
  );
}
