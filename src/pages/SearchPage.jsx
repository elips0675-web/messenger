import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { chats, users } from '../data/mockData';

function allMessages() {
  const all = [];
  chats.forEach(c => {
    (c.messages || []).forEach(m => {
      all.push({ ...m, chatId: c.id, chatName: c.name, chatType: c.type });
    });
  });
  return all;
}

const MSGS = allMessages();

export default function SearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [sender, setSender] = useState('');
  const [chatFilter, setChatFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const results = useMemo(() => {
    if (!query && !sender && !chatFilter && !dateFrom && !dateTo) return [];
    return MSGS.filter(m => {
      if (query && !m.text.toLowerCase().includes(query.toLowerCase())) return false;
      if (sender && m.userId !== Number(sender)) return false;
      if (chatFilter && m.chatId !== Number(chatFilter)) return false;
      if (dateFrom && m.time < dateFrom) return false;
      if (dateTo && m.time > dateTo) return false;
      return true;
    });
  }, [query, sender, chatFilter, dateFrom, dateTo]);

  const highlight = (text) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((p, i) => p.toLowerCase() === query.toLowerCase() ? <mark key={i} style={{ background: '#fef08a', padding: '1px 2px', borderRadius: 3 }}>{p}</mark> : p);
  };

  return (
    <Layout title="Поиск по всем чатам">
      <div style={{ marginBottom: 16 }}>
        <input autoFocus placeholder="🔍 Что ищем?" value={query} onChange={e => setQuery(e.target.value)}
          style={{ width: '100%', padding: '10px 14px', border: '2px solid var(--primary)', borderRadius: 10, fontSize: 15, outline: 'none', boxSizing: 'border-box' }} />
        <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={sender} onChange={e => setSender(e.target.value)}
            style={{ padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, background: 'var(--surface)' }}>
            <option value="">Все отправители</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <select value={chatFilter} onChange={e => setChatFilter(e.target.value)}
            style={{ padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, background: 'var(--surface)' }}>
            <option value="">Все чаты</option>
            {chats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            style={{ padding: '5px 8px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, outline: 'none' }} />
          <span style={{ fontSize: 12, color: 'var(--text2)' }}>—</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            style={{ padding: '5px 8px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, outline: 'none' }} />
          <span style={{ fontSize: 12, color: 'var(--text2)' }}>{results.length} результатов</span>
        </div>
      </div>

      {results.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {results.map(m => {
            const u = users.find(x => x.id === m.userId);
            return (
              <div key={m.id} className="card" style={{ cursor: 'pointer', padding: '10px 14px' }}
                onClick={() => navigate(`/chat/${m.chatId}`)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{u?.name || '—'}</span>
                    <span style={{ fontSize: 11, color: 'var(--text2)', background: 'var(--hover)', padding: '2px 8px', borderRadius: 10 }}>{m.chatName}</span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text2)' }}>{m.time}</span>
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.4 }}>{highlight(m.text)}</div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🔍</div>
          <p>{query || sender || chatFilter ? 'Ничего не найдено' : 'Введите поисковый запрос'}</p>
        </div>
      )}
    </Layout>
  );
}