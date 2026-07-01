const MAP = {
  pending:    { bg: '#fef9c3', c: '#92400e', label: '⏳ Ожидает' },
  approved:   { bg: '#dcfce7', c: '#166534', label: '✅ Согласовано' },
  rejected:   { bg: '#fee2e2', c: '#991b1b', label: '❌ Отклонено' },
  active:     { bg: '#dcfce7', c: '#166534', label: 'Активен' },
  inactive:   { bg: '#f3f4f6', c: '#6b7280', label: 'Неактивен' },
  done:       { bg: '#dcfce7', c: '#166534', label: '✅ Выполнено' },
  todo:       { bg: '#fef9c3', c: '#92400e', label: 'Нужно сделать' },
  in_progress:{ bg: '#dbeafe', c: '#1e40af', label: '🔄 В работе' },
};

export default function StatusBadge({ status }) {
  const s = MAP[status] || { bg: '#f3f4f6', c: '#6b7280', label: status };
  return (
    <span style={{
      background: s.bg, color: s.c, padding: '2px 8px', borderRadius: 6,
      fontSize: 11, fontWeight: 600, display: 'inline-block',
    }}>
      {s.label}
    </span>
  );
}
