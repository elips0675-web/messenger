import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { api } from '../lib/api';

export default function BotsPage() {
  const [bots, setBots] = useState([]);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    api.get('/admin/bots').then(setBots).catch(() => { try { setBots(JSON.parse(localStorage.getItem('bots') || '[]')); } catch {} });
  }, []);

  const save = (next) => { setBots(next); localStorage.setItem('bots', JSON.stringify(next)); };

  const addBot = () => {
    const bot = { id: Date.now(), name: 'Новый бот', avatar: '🤖', desc: '', token: crypto.randomUUID?.()?.replace(/-/g, '').slice(0, 16), active: true };
    save([...bots, bot]);
    try { api.post('/admin/bots', bot); } catch {}
    setShowAdd(false);
  };

  const toggleBot = async (id) => {
    save(bots.map(b => b.id === id ? { ...b, active: !b.active } : b));
    try { await api.put(`/admin/bots/${id}`, { active: !bots.find(b => b.id === id)?.active }); } catch {}
  };

  const deleteBot = async (id) => {
    save(bots.filter(b => b.id !== id));
    try { await api.delete(`/admin/bots/${id}`); } catch {}
  };

  return (
    <Layout title="Чат-боты">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontSize: 13, color: 'var(--text2)' }}>{bots.length} ботов</span>
        <button className="btn-primary" style={{ width: 'auto', padding: '8px 20px' }} onClick={() => setShowAdd(!showAdd)}>➕ Бот</button>
      </div>
      {showAdd && (
        <div className="card" style={{ marginBottom: 12 }}>
          <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 8 }}>Шаблоны: Помощник 🤖, Погода 🌤️, Jira 🔧, GitLab 🦊</p>
          <button className="send-btn" onClick={addBot}>Создать бота</button>
        </div>
      )}
      {bots.map(b => (
        <div key={b.id} className="card" style={{ marginBottom: 6, opacity: b.active ? 1 : .5 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 24 }}>{b.avatar || '🤖'}</span>
              <div>
                <strong>{b.name}</strong>
                <div style={{ fontSize: 12, color: 'var(--text2)' }}>{b.desc || 'Нет описания'}</div>
                <div style={{ fontSize: 10, color: 'var(--text2)', fontFamily: 'monospace' }}>Токен: {b.token}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button className="btn-sm" onClick={() => toggleBot(b.id)}>{b.active ? '🔊' : '🔇'}</button>
              <button className="btn-sm" style={{ color: 'var(--red)' }} onClick={() => deleteBot(b.id)}>🗑️</button>
            </div>
          </div>
        </div>
      ))}
      {bots.length === 0 && <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>🤖 <p>Нет ботов</p></div>}
    </Layout>
  );
}
