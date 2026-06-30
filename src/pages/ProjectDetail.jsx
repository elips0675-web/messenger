import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../lib/api';
import { users } from '../data/mockData';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [proj, setProj] = useState(null);
  const [tab, setTab] = useState('tasks');
  const [wiki, setWiki] = useState('');
  const [chatMsg, setChatMsg] = useState('');

  useEffect(() => {
    api.get(`/projects/${id}`).then(setProj).catch(() => {});
  }, [id]);

  const update = async (changes) => {
    const next = { ...proj, ...changes };
    setProj(next);
    try { await api.put(`/projects/${id}`, changes); } catch {}
  };

  const saveWiki = async () => {
    try { await api.put(`/projects/${id}/wiki`, { content: wiki }); } catch {}
  };

  if (!proj) return <Layout title="Загрузка..."><p>Загрузка...</p></Layout>;

  return (
    <Layout title={proj.name} showBack onBack={() => navigate('/projects')}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 28 }}>{proj.icon || '📁'}</span>
        <input value={proj.name} onChange={e => update({ name: e.target.value })}
          style={{ fontSize: 18, fontWeight: 700, border: 'none', outline: 'none', background: 'transparent', flex: 1 }} />
        <select value={proj.status} onChange={e => update({ status: e.target.value })} className="btn-sm" style={{ fontSize: 12 }}>
          <option value="active">🟢 Активен</option><option value="paused">🔄 На паузе</option><option value="done">✅ Завершён</option>
        </select>
      </div>

      <div className="tabs" style={{ flexWrap: 'wrap', marginBottom: 12 }}>
        {['tasks', 'chat', 'files', 'wiki', 'members'].map(t => (
          <div key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === 'tasks' ? '📋 Задачи' : t === 'chat' ? '💬 Чат' : t === 'files' ? '📁 Файлы' : t === 'wiki' ? '📝 Wiki' : '👥 Участники'}
          </div>
        ))}
      </div>

      {tab === 'tasks' && (
        <div>{(proj.tasks || []).map(t => (
          <div key={t.id} className="task-row" style={{ cursor: 'pointer' }} onClick={() => navigate(`/task/${t.id}`)}>
            <strong>{t.title}</strong>
            <span className={`priority-tag status-${t.status}`}>{t.status === 'todo' ? '📋' : t.status === 'progress' ? '🔄' : '✅'}</span>
          </div>
        ))}</div>
      )}

      {tab === 'chat' && (
        <div>
          <div style={{ maxHeight: 300, overflowY: 'auto', marginBottom: 8 }}>
            {(proj.chat || []).map((m, i) => (
              <div key={i} style={{ padding: '6px 10px', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                <strong>{m.user_name || 'User'}</strong>: {m.text}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={chatMsg} onChange={e => setChatMsg(e.target.value)} placeholder="Сообщение..." onKeyDown={e => e.key === 'Enter' && (() => {})}
              style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, outline: 'none', fontSize: 13 }} />
            <button className="send-btn">Отправить</button>
          </div>
        </div>
      )}

      {tab === 'files' && (
        <div>{(proj.files || []).map(f => (
          <div key={f.id} style={{ padding: '6px 0', fontSize: 13 }}>📄 {f.name} ({f.size})</div>
        ))}</div>
      )}

      {tab === 'wiki' && (
        <div>
          <textarea value={wiki} onChange={e => setWiki(e.target.value)} rows={10}
            style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 8, padding: 12, fontSize: 13, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
            placeholder="Напишите wiki-страницу проекта..." />
          <button className="send-btn" style={{ marginTop: 8 }} onClick={saveWiki}>💾 Сохранить</button>
        </div>
      )}

      {tab === 'members' && (
        <div>{(proj.members || []).map(m => (
          <div key={m.id} style={{ padding: '6px 0', fontSize: 13 }}>👤 {m.name} — {m.email}</div>
        ))}</div>
      )}
    </Layout>
  );
}
