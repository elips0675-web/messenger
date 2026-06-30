import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../lib/api';
import { users } from '../data/mockData';

export default function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [tab, setTab] = useState('info');
  const [chatMsg, setChatMsg] = useState('');
  const [chatMsgs, setChatMsgs] = useState([]);

  useEffect(() => {
    api.get(`/tasks/${id}`).then(setTask).catch(() => {
      try {
        const all = JSON.parse(localStorage.getItem('tasks_data') || '[]');
        const found = all.find(t => t.id === Number(id));
        if (found) setTask(found);
      } catch {}
    });
  }, [id]);

  const update = async (changes) => {
    const next = { ...task, ...changes };
    setTask(next);
    try { await api.put(`/tasks/${id}`, changes); } catch {
      try {
        const all = JSON.parse(localStorage.getItem('tasks_data') || '[]');
        localStorage.setItem('tasks_data', JSON.stringify(all.map(t => t.id === Number(id) ? next : t)));
      } catch {}
    }
  };

  const addSubtask = async () => {
    const title = prompt('Название подзадачи:');
    if (!title?.trim()) return;
    const sub = { id: Date.now(), title: title.trim(), done: false };
    setTask({ ...task, subtasks: [...(task.subtasks || []), sub] });
    try { await api.post(`/tasks/${id}/subtasks`, { title: title.trim() }); } catch {}
  };

  const toggleSubtask = async (idx) => {
    const subs = [...(task.subtasks || [])];
    subs[idx] = { ...subs[idx], done: !subs[idx].done };
    setTask({ ...task, subtasks: subs });
    try { await api.put(`/tasks/${id}/subtasks/${subs[idx].id}`, { done: subs[idx].done }); } catch {}
  };

  const sendMsg = () => {
    if (!chatMsg.trim()) return;
    const msg = { id: Date.now(), user_id: 1, user_name: 'Алексей Волков', text: chatMsg, created_at: new Date().toISOString() };
    setChatMsgs(prev => [...prev, msg]);
    setChatMsg('');
    try { api.post(`/tasks/${id}/messages`, { text: msg.text }); } catch {}
  };

  if (!task) return <Layout title="Загрузка..."><p>Загрузка...</p></Layout>;

  return (
    <Layout title={task.title} showBack onBack={() => navigate('/tasks')}>
      <div className="tabs" style={{ flexWrap: 'wrap', marginBottom: 12 }}>
        {['info', 'subtasks', 'chat', 'activity'].map(t => (
          <div key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === 'info' ? '📋 Инфо' : t === 'subtasks' ? '✅ Подзадачи' : t === 'chat' ? '💬 Чат' : '📋 Активность'}
          </div>
        ))}
      </div>

      {tab === 'info' && (
        <div className="card">
          <div className="form-group"><label>Название</label>
            <input value={task.title} onChange={e => update({ title: e.target.value })} style={{ fontSize: 16, fontWeight: 700 }} />
          </div>
          <div className="form-group"><label>Описание</label>
            <textarea value={task.description || ''} onChange={e => update({ description: e.target.value })} rows={3} />
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div className="form-group"><label>Статус</label>
              <select value={task.status} onChange={e => update({ status: e.target.value })}>
                <option value="todo">К выполнению</option><option value="progress">В работе</option><option value="done">Готово</option>
              </select>
            </div>
            <div className="form-group"><label>Приоритет</label>
              <select value={task.priority} onChange={e => update({ priority: e.target.value })}>
                <option value="low">Низкий</option><option value="medium">Средний</option><option value="high">Высокий</option>
              </select>
            </div>
            <div className="form-group"><label>Исполнитель</label>
              <select value={task.assignee_id || task.assignee} onChange={e => update({ assignee_id: Number(e.target.value) })}>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Срок</label>
              <input type="date" value={task.deadline || ''} onChange={e => update({ deadline: e.target.value })} />
            </div>
          </div>
        </div>
      )}

      {tab === 'subtasks' && (
        <div>
          <button className="btn-sm" style={{ marginBottom: 12 }} onClick={addSubtask}>➕ Подзадача</button>
          {(task.subtasks || []).map((s, i) => (
            <label key={s.id || i} className="switch-row" style={{ padding: '6px 0' }}>
              <input type="checkbox" checked={s.done} onChange={() => toggleSubtask(i)} />
              <span style={{ textDecoration: s.done ? 'line-through' : 'none', opacity: s.done ? .5 : 1 }}>{s.title}</span>
            </label>
          ))}
          {(!task.subtasks || task.subtasks.length === 0) && <p style={{ color: 'var(--text2)' }}>Нет подзадач</p>}
        </div>
      )}

      {tab === 'chat' && (
        <div>
          <div style={{ maxHeight: 300, overflowY: 'auto', marginBottom: 8 }}>
            {chatMsgs.map(m => (
              <div key={m.id} style={{ padding: '6px 10px', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                <strong>{m.user_name}</strong>: {m.text}
                <div style={{ fontSize: 11, color: 'var(--text2)' }}>{m.created_at}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={chatMsg} onChange={e => setChatMsg(e.target.value)} placeholder="Сообщение..." onKeyDown={e => e.key === 'Enter' && sendMsg()}
              style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, outline: 'none', fontSize: 13 }} />
            <button className="send-btn" onClick={sendMsg}>Отправить</button>
          </div>
        </div>
      )}

      {tab === 'activity' && (
        <div>
          <p style={{ color: 'var(--text2)' }}>История изменений появится после подключения бэкенда</p>
          {(task.activity || []).map((a, i) => (
            <div key={i} style={{ padding: '6px 0', fontSize: 13 }}>{a.action}</div>
          ))}
        </div>
      )}
    </Layout>
  );
}
