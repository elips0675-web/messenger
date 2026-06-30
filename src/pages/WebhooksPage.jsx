import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { api } from '../lib/api';

export default function WebhooksPage() {
  const [hooks, setHooks] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('incoming');
  const [url, setUrl] = useState('');

  useEffect(() => {
    api.get('/admin/webhooks').then(setHooks).catch(() => {
      try { setHooks(JSON.parse(localStorage.getItem('webhooks') || '[]')); } catch {}
    });
  }, []);

  const save = (next) => { setHooks(next); localStorage.setItem('webhooks', JSON.stringify(next)); };

  const addHook = async () => {
    if (!name.trim()) return;
    const hook = { id: Date.now(), name: name.trim(), type, url: type === 'outgoing' ? url.trim() : '', token: crypto.randomUUID?.()?.replace(/-/g, '').slice(0, 16) || Math.random().toString(36).slice(2, 18), active: true };
    save([...hooks, hook]);
    try { await api.post('/admin/webhooks', { name, type, url }); } catch {}
    setName(''); setUrl(''); setShowAdd(false);
  };

  const toggleHook = async (id) => {
    save(hooks.map(h => h.id === id ? { ...h, active: !h.active } : h));
    try { await api.put(`/admin/webhooks/${id}`, { active: !hooks.find(h => h.id === id)?.active }); } catch {}
  };

  const deleteHook = async (id) => {
    save(hooks.filter(h => h.id !== id));
    try { await api.delete(`/admin/webhooks/${id}`); } catch {}
  };

  return (
    <Layout title="Вебхуки">
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, color: 'var(--text2)' }}>Активных: {hooks.filter(h => h.active).length}</span>
        <button className="btn-primary" style={{ width: 'auto', padding: '8px 20px' }} onClick={() => setShowAdd(!showAdd)}>➕ Вебхук</button>
      </div>

      {showAdd && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div className="form-group"><label>Название</label><input value={name} onChange={e => setName(e.target.value)} autoFocus /></div>
          <div className="form-group"><label>Тип</label>
            <select value={type} onChange={e => setType(e.target.value)}>
              <option value="incoming">Входящий</option><option value="outgoing">Исходящий</option>
            </select>
          </div>
          {type === 'outgoing' && <div className="form-group"><label>URL</label><input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." /></div>}
          <button className="send-btn" style={{ marginTop: 4 }} onClick={addHook}>Создать</button>
        </div>
      )}

      {hooks.map(h => (
        <div key={h.id} className="card" style={{ marginBottom: 6, opacity: h.active ? 1 : .5 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>{h.name}</strong>
              <span style={{ fontSize: 11, color: 'var(--text2)', marginLeft: 8 }}>{h.type === 'incoming' ? '📥 Входящий' : '📤 Исходящий'}</span>
              <div style={{ fontSize: 11, color: 'var(--text2)', fontFamily: 'monospace', marginTop: 2 }}>
                {h.type === 'incoming' ? `Токен: ${h.token}` : h.url}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button className="btn-sm" onClick={() => toggleHook(h.id)}>{h.active ? '🔊' : '🔇'}</button>
              <button className="btn-sm" style={{ color: 'var(--red)' }} onClick={() => deleteHook(h.id)}>🗑️</button>
            </div>
          </div>
        </div>
      ))}
    </Layout>
  );
}
