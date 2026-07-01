import { useState } from 'react';
import Layout from '../components/Layout';
import { api } from '../lib/api';
import useFetch from '../lib/useFetch';

export default function NotificationsPage() {
  const [pushenabled, setPushEnabled] = useState(false);
  const { data: notifications, loading, setData: setNotifications } = useFetch('/notifications');

  const save = (next) => {
    setNotifications(next);
    localStorage.setItem('notifications', JSON.stringify(next));
  };

  const markRead = async (id) => {
    save((notifications || []).map(n => n.id === id ? { ...n, read: true } : n));
    try { await api.put(`/notifications/${id}/read`); } catch {}
  };

  const markAllRead = async () => {
    save((notifications || []).map(n => ({ ...n, read: true })));
    try { await api.put('/notifications/read-all'); } catch {}
  };

  const dismiss = async (id) => {
    save((notifications || []).filter(n => n.id !== id));
    try { await api.delete(`/notifications/${id}`); } catch {}
  };

  const clearAll = async () => {
    save([]);
    try { await api.delete('/notifications'); } catch {}
  };

  const unread = (notifications || []).filter(n => !n.read).length;

  return (
    <Layout title="Уведомления">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 13, color: 'var(--text2)' }}>{notifications.length} уведомлений, {unread} непрочитанных</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {unread > 0 && <button className="btn-sm" onClick={markAllRead}>✓ Все прочитаны</button>}
          {notifications.length > 0 && <button className="btn-sm" style={{ color: 'var(--red)' }} onClick={clearAll}>✕ Очистить всё</button>}
        </div>
      </div>
      {notifications.map(n => (
        <div key={n.id} className={`notif-item ${!n.read ? 'unread' : ''}`}
          onClick={() => !n.read && markRead(n.id)}
          style={{ cursor: 'pointer', opacity: n.read ? .6 : 1, borderRadius: 10, marginBottom: 6, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="notif-icon">{n.type === 'task' ? '📋' : n.type === 'mention' ? '@' : n.type === 'deadline' ? '⏰' : n.type === 'event' ? '🎉' : '⚙️'}</div>
          <div className="notif-text" style={{ flex: 1 }}>
            <p>{n.text}</p>
            <div className="time" style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{n.time}</div>
          </div>
          <button className="btn-sm" style={{ fontSize: 12, opacity: .5 }} onClick={(e) => { e.stopPropagation(); dismiss(n.id); }}>✕</button>
        </div>
      ))}
      {notifications.length === 0 && (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🔔</div>
          <p>Нет уведомлений</p>
        </div>
      )}
    </Layout>
  );
}
