import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../lib/api';

export default function Chats() {
  const navigate = useNavigate();
  const [chatList, setChatList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/chats').then(data => { setChatList(data); setLoading(false); }).catch(() => {
      try {
        const saved = JSON.parse(localStorage.getItem('chats_data'));
        if (saved?.length) { setChatList(saved); setLoading(false); return; }
      } catch {}
      import('../data/mockData').then(m => { setChatList(m.chats); setLoading(false); });
    });
  }, []);

  const rooms = chatList.filter(c => c.type === 'group' || c.type === 'channel');
  const personal = chatList.filter(c => c.type === 'personal');

  const sortByTime = (a, b) => {
    const tA = a.lastTime || a.last_time || '';
    const tB = b.lastTime || b.last_time || '';
    return tB.localeCompare(tA) || (b.unread || 0) - (a.unread || 0);
  };

  const renderChat = (c) => (
    <div key={c.id} className="chat-item" onClick={() => navigate(`/chat/${c.id}`)}>
      <span className="chat-avatar">{c.avatar || (c.type === 'group' ? '🏢' : '💬')}</span>
      <div className="chat-info">
        <h4>{c.name}</h4>
        <p>{c.lastMsg || c.last_msg || 'Нет сообщений'}</p>
      </div>
      <div className="chat-meta">
        <div className="time">{c.lastTime || c.last_time || ''}</div>
        {(c.unread || 0) > 0 && <span className="unread">{c.unread}</span>}
      </div>
    </div>
  );

  return (
    <Layout title="Чаты">
      {loading ? <div style={{ padding: 40, textAlign: 'center', color: 'var(--text2)' }}>Загрузка...</div> : (
        <div className="chat-list" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {rooms.length > 0 && (
            <>
              <div style={{ fontSize: 12, color: 'var(--text2)', padding: '8px 18px 4px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.8px' }}>
                🏠 Комнаты ({rooms.length})
              </div>
              {rooms.sort(sortByTime).map(renderChat)}
            </>
          )}
          {personal.length > 0 && (
            <>
              <div style={{ fontSize: 12, color: 'var(--text2)', padding: '8px 18px 4px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.8px' }}>
                👤 Личные ({personal.length})
              </div>
              {personal.sort(sortByTime).map(renderChat)}
            </>
          )}
        </div>
      )}
    </Layout>
  );
}
