import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { api } from '../lib/api';

const STATUS_COLORS = { open: '#2b7ef9', in_progress: '#f59e0b', closed: '#22c55e', pending: '#8b5cf6' };
const STATUS_LABELS = { open: 'Открыт', in_progress: 'В работе', closed: 'Закрыт', pending: 'Ожидание' };
const PRIORITY_COLORS = { low: '#22c55e', medium: '#f59e0b', high: '#ef4444' };

export default function Tickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/tickets').then(data => { setTickets(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  return (
    <Layout title="Тикеты" showBack onBack={() => window.history.back()}>
      <div style={{ padding: 16 }}>
        {loading ? <p style={{ textAlign: 'center', color: 'var(--text2)' }}>Загрузка...</p> : tickets.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text2)', padding: 40 }}>Нет тикетов</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {tickets.map(t => (
              <div key={t.id} style={{ padding: 12, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <strong>#{t.id} {t.subject}</strong>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: STATUS_COLORS[t.status] + '20', color: STATUS_COLORS[t.status] }}>
                      {STATUS_LABELS[t.status] || t.status}
                    </span>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: PRIORITY_COLORS[t.priority] + '20', color: PRIORITY_COLORS[t.priority] }}>
                      {t.priority}
                    </span>
                  </div>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 4 }}>{t.description}</div>
                <div style={{ fontSize: 11, color: 'var(--text2)', display: 'flex', gap: 12 }}>
                  <span>📅 {t.created_at}</span>
                  {t.requester_name && <span>👤 {t.requester_name}</span>}
                  {t.assignee_name && <span>➡️ {t.assignee_name}</span>}
                  {t.channel === 'telegram' && <span>📱 Telegram</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
