import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../lib/api';
import { users } from '../data/mockData';

export default function ChannelsPage() {
  const navigate = useNavigate();
  const [channels, setChannels] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', desc: '', type: 'open' });

  useEffect(() => {
    api.get('/channels').then(setChannels).catch(() => {});
  }, []);

  const addChannel = async () => {
    if (!form.name.trim()) return;
    try {
      const ch = await api.post('/channels', form);
      setChannels(prev => [...prev, ch]);
    } catch {}
    setForm({ name: '', desc: '', type: 'open' });
    setShowAdd(false);
  };

  const joinChannel = async (id) => {
    setChannels(prev => prev.map(c => c.id === id ? { ...c, memberIds: [...(c.memberIds || []), 1] } : c));
    try { await api.post(`/channels/${id}/join`); } catch {}
  };

  const leaveChannel = async (id) => {
    setChannels(prev => prev.map(c => c.id === id ? { ...c, memberIds: (c.memberIds || []).filter(m => m !== 1) } : c));
    try { await api.post(`/channels/${id}/leave`); } catch {}
  };

  return (
    <Layout title="Каналы">
      <button className="btn-primary" style={{ width: 'auto', padding: '8px 20px', marginBottom: 12 }} onClick={() => setShowAdd(!showAdd)}>➕ Канал</button>

      {showAdd && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div className="form-group"><label>Название</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} autoFocus /></div>
          <div className="form-group"><label>Описание</label><textarea value={form.desc} onChange={e => setForm({...form, desc: e.target.value})} rows={2} /></div>
          <div className="form-group"><label>Тип</label>
            <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
              <option value="open">Открытый</option><option value="closed">Закрытый</option>
            </select>
          </div>
          <button className="send-btn" onClick={addChannel}>Создать</button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {channels.map(ch => {
          const isMember = (ch.memberIds || []).includes(1);
          return (
            <div key={ch.id} className="card" style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              onClick={() => isMember && navigate('/chats')}>
              <div>
                <strong style={{ fontSize: 14 }}># {ch.name}</strong>
                <div style={{ fontSize: 12, color: 'var(--text2)' }}>{ch.description || ''} • {(ch.memberIds || []).length || ch.member_count || 0} участников</div>
              </div>
              {!isMember ? (
                <button className="btn-sm" onClick={e => { e.stopPropagation(); joinChannel(ch.id); }}>Подписаться</button>
              ) : (
                <button className="btn-sm" onClick={e => { e.stopPropagation(); leaveChannel(ch.id); }} style={{ color: 'var(--red)' }}>Отписаться</button>
              )}
            </div>
          );
        })}
      </div>
    </Layout>
  );
}
