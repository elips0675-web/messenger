import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../lib/api';
import useFetch from '../lib/useFetch';

export default function Tasks() {
  const navigate = useNavigate();
  const { data: tasks, loading, setData: setTasks } = useFetch('/tasks');
  const [filter, setFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: '', desc: '', priority: 'medium', assignee: 1, deadline: '' });

  const filtered = filter === 'all' ? (tasks || []) : (tasks || []).filter(t => t.status === filter);

  const addTask = async () => {
    if (!form.title.trim()) return;
    try {
      const task = await api.post('/tasks', form);
      setTasks(prev => [task, ...prev]);
    } catch {
      const task = { id: Date.now(), ...form, status: 'todo', subtasks: [], created_at: new Date().toISOString() };
      setTasks(prev => [task, ...prev]);
      localStorage.setItem('tasks_data', JSON.stringify([task, ...(tasks || [])]));
    }
    setForm({ title: '', desc: '', priority: 'medium', assignee: 1, deadline: '' });
    setShowAdd(false);
  };

  const updateStatus = async (id, status) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
    try { await api.patch(`/tasks/${id}/status`, { status }); } catch {}
  };

  const deleteTask = async (id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    try { await api.delete(`/tasks/${id}`); } catch {}
  };

  return (
    <Layout title="Задачи">
      <div className="tabs" style={{ flexWrap: 'wrap', marginBottom: 16 }}>
        {[{ key: 'all', label: 'Все' }, { key: 'todo', label: 'К выполнению' }, { key: 'progress', label: 'В работе' }, { key: 'done', label: 'Готово' }].map(t => (
          <div key={t.key} className={`tab ${filter === t.key ? 'active' : ''}`} onClick={() => setFilter(t.key)}>
            {t.label} ({filter === 'all' ? (tasks || []).length : (tasks || []).filter(ts => ts.status === t.key).length})
          </div>
        ))}
        <button className="btn-primary" style={{ width: 'auto', padding: '6px 16px', marginLeft: 'auto', marginTop: 0 }} onClick={() => setShowAdd(true)}>➕ Задачу</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">✅</div>
            <p>Нет задач</p>
          </div>
        )}
        {filtered.map(t => (
          <div key={t.id} className="task-card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', cursor: 'pointer' }}
            onClick={() => navigate(`/task/${t.id}`)}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h4 style={{ fontSize: 15, fontWeight: 600 }}>{t.title}</h4>
              {t.description && <p style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.description}</p>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <select value={t.status} onClick={e => e.stopPropagation()} onChange={e => updateStatus(t.id, e.target.value)}
                style={{ fontSize: 11, padding: '4px 8px', borderRadius: 8, border: '1px solid var(--border)', outline: 'none', cursor: 'pointer', background: 'var(--surface)' }}>
                <option value="todo">📋 К выполнению</option>
                <option value="progress">🔄 В работе</option>
                <option value="done">✅ Готово</option>
              </select>
              <span className={`status-badge status-${t.priority === 'high' ? '' : ''} priority-badge priority-${t.priority}`}>
                {t.priority === 'high' ? '🔥 Высокий' : t.priority === 'medium' ? '⚡ Средний' : '💤 Низкий'}
              </span>
              <button className="btn-sm" style={{ color: 'var(--red)', fontSize: 12 }} onClick={e => { e.stopPropagation(); deleteTask(t.id); }}>🗑️</button>
            </div>
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="lightbox" onClick={() => setShowAdd(false)}>
          <div className="lightbox-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <h3 style={{ marginBottom: 16 }}>Новая задача</h3>
            <div className="form-group"><label>Название</label><input value={form.title} onChange={e => setForm({...form, title: e.target.value})} autoFocus /></div>
            <div className="form-group"><label>Описание</label><textarea value={form.desc} onChange={e => setForm({...form, desc: e.target.value})} rows={2} style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, outline: 'none', fontSize: 14, resize: 'vertical', boxSizing: 'border-box', background: 'var(--bg)' }} /></div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div className="form-group"><label>Приоритет</label>
                <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>
                  <option value="low">💤 Низкий</option><option value="medium">⚡ Средний</option><option value="high">🔥 Высокий</option>
                </select>
              </div>
              <div className="form-group"><label>Исполнитель ID</label><input value={form.assignee} onChange={e => setForm({...form, assignee: e.target.value})} /></div>
            </div>
            <div className="form-group"><label>Срок</label><input type="date" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} /></div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="btn-primary" onClick={addTask}>Создать</button>
              <button className="btn-sm" onClick={() => setShowAdd(false)}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
