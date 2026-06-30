import { useState, useEffect } from 'react';
import Layout from '../components/Layout';

const DUMMY_LOG = [
  { id: 1, user: 'Анна К.', action: 'Удалила сообщение в #общий', time: '10:23', date: '2026-06-30' },
  { id: 2, user: 'Иван П.', action: 'Изменил права доступа канала #dev', time: '10:15', date: '2026-06-30' },
  { id: 3, user: 'Мария С.', action: 'Создала проект "Q4 Launch"', time: '09:45', date: '2026-06-30' },
  { id: 4, user: 'Анна К.', action: 'Пригласила пользователя demo@test.com', time: '09:30', date: '2026-06-30' },
  { id: 5, user: 'Пётр В.', action: 'Назначил задачу Ивану П.', time: '19:12', date: '2026-06-29' },
  { id: 6, user: 'Ольга Н.', action: 'Загрузила файл report.pdf', time: '18:00', date: '2026-06-29' },
  { id: 7, user: 'Система', action: 'Автоматическая архивация чата #design', time: '02:00', date: '2026-06-29' },
];

const ACTION_TYPES = ['Все', 'Сообщения', 'Доступ', 'Файлы', 'Администрирование'];

export default function AuditLogPage() {
  const [logs, setLogs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('audit_log') || '[]'); } catch { return []; }
  });
  const [filter, setFilter] = useState('Все');

  useEffect(() => {
    if (logs.length === 0) {
      setLogs(DUMMY_LOG);
      localStorage.setItem('audit_log', JSON.stringify(DUMMY_LOG));
    }
  }, [logs.length]);

  const filtered = filter === 'Все' ? logs : logs;

  return (
    <Layout>
      <div className="page-header">
        <h1>Журнал аудита</h1>
        <div style={{ display: 'flex', gap: 6 }}>
          {ACTION_TYPES.map(t => (
            <button key={t} className={`btn-sm ${filter === t ? '' : ''}`}
              onClick={() => setFilter(t)}
              style={{ background: filter === t ? 'var(--primary)' : 'var(--surface)', color: filter === t ? '#fff' : 'var(--text)', border: '1px solid var(--border)' }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {filtered.map(log => (
          <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--surface)', borderRadius: 10, border: '1px solid var(--border)' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: 'var(--primary)', flexShrink: 0 }}>
              {log.user[0]}
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontWeight: 600, marginRight: 6, fontSize: 13 }}>{log.user}</span>
              <span style={{ fontSize: 13 }}>{log.action}</span>
            </div>
            <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--text2)' }}>
              <div>{log.date}</div>
              <div>{log.time}</div>
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
}