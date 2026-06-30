import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { api } from '../lib/api';

function loadTasks() {
  return [
    { id: 1, title: 'Разработать API чатов', status: 'done', priority: 'high', assignee: 3, desc: 'REST API + WebSocket', created: '2026-06-01', deadline: '2026-07-01' },
    { id: 2, title: 'Внедрить систему уведомлений', status: 'progress', priority: 'high', assignee: 6, desc: 'Email + push', created: '2026-06-10', deadline: '2026-07-15' },
    { id: 3, title: 'Сверка квартальных отчётов', status: 'progress', priority: 'medium', assignee: 4, desc: 'Q2 отчёт', created: '2026-06-15', deadline: '2026-07-10' },
    { id: 4, title: 'Наём фронтенд-разработчика', status: 'progress', priority: 'medium', assignee: 5, desc: 'Senior React', created: '2026-06-05', deadline: '2026-07-31' },
    { id: 5, title: 'Рефакторинг авторизации', status: 'todo', priority: 'low', assignee: 6, desc: 'JWT refresh', created: '2026-06-20', deadline: '2026-08-01' },
  ];
}

const STATUS_COLORS = { done: '#22c55e', progress: '#2b7ef9', todo: '#d1d5db' };
const SCALE_OPTIONS = { day: { label: 'День', step: 1, width: 60 }, week: { label: 'Неделя', step: 7, width: 80 }, month: { label: 'Месяц', step: 30, width: 120 } };

export default function Gantt() {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [scale, setScale] = useState('week');
  const [showAdd, setShowAdd] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [form, setForm] = useState({ title: '', desc: '', assignee: 3, deadline: '', created: '' });

  useEffect(() => {
    Promise.all([
      api.get('/gantt').catch(() => { try { const s = JSON.parse(localStorage.getItem('gantt_tasks')); if (s?.length) return s; } catch {} return loadTasks(); }),
      api.get('/corporate/users').catch(() => {
        try { return JSON.parse(localStorage.getItem('admin_users') || '[]'); } catch { return []; }
      }),
    ]).then(([t, u]) => {
      setTasks(Array.isArray(t) ? t : loadTasks());
      setUsers(u);
    });
  }, []);

  const save = (next) => {
    setTasks(next);
    localStorage.setItem('gantt_tasks', JSON.stringify(next));
    try { api.put('/gantt', next); } catch {}
  };

  const today = new Date('2026-07-01');
  const startDate = new Date('2026-06-01');
  const endDate = new Date('2026-08-10');
  const totalDays = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)) || 1;

  const cells = [];
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + (SCALE_OPTIONS[scale]?.step || 7))) {
    cells.push(new Date(d));
  }

  const toDays = (dateStr) => Math.floor((new Date(dateStr) - startDate) / (1000 * 60 * 60 * 24));

  const addTask = () => {
    if (!form.title.trim()) return;
    const task = {
      id: Date.now(), title: form.title.trim(), desc: form.desc.trim(),
      status: 'todo', priority: 'medium',
      assignee: Number(form.assignee),
      created: form.created || new Date().toISOString().slice(0, 10),
      deadline: form.deadline || '',
    };
    save([...tasks, task]);
    setForm({ title: '', desc: '', assignee: 3, deadline: '', created: '' });
    setShowAdd(false);
  };

  const deleteTask = (id) => {
    save(tasks.filter(t => t.id !== id));
    setEditTask(null);
  };

  const updateTask = (id, changes) => {
    save(tasks.map(t => t.id === id ? { ...t, ...changes } : t));
  };

  const handleBarDrag = (e, task) => {
    if (e.button !== 0) return;
    const startX = e.clientX;
    setDragging(task.id);

    const onMove = (ev) => {
      const dx = ev.clientX - startX;
      const cellW = SCALE_OPTIONS[scale]?.width || 80;
      const dayShift = Math.round(dx / cellW * (SCALE_OPTIONS[scale]?.step || 7));
      if (!task.created) return;
      const origEnd = new Date(task.deadline || task.created);
      const newEnd = new Date(origEnd);
      newEnd.setDate(newEnd.getDate() + dayShift);
      updateTask(task.id, { deadline: newEnd.toISOString().slice(0, 10) });
    };

    const onUp = () => {
      setDragging(null);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  if (!tasks.length) return <Layout title="Диаграмма Ганта"><div style={{ padding: 40, textAlign: 'center', color: 'var(--text2)' }}>Загрузка...</div></Layout>;

  return (
    <Layout title="Диаграмма Ганта">
      <div style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Масштаб:</span>
          {Object.entries(SCALE_OPTIONS).map(([k, v]) => (
            <div key={k} className={`tab ${scale === k ? 'active' : ''}`} onClick={() => setScale(k)}>{v.label}</div>
          ))}
          <span style={{ fontSize: 13, color: 'var(--text2)', marginLeft: 12 }}>Задач: {tasks.length}</span>
        </div>
        <button className="btn-primary" style={{ width: 'auto', padding: '8px 20px' }} onClick={() => setShowAdd(true)}>➕ Задача</button>
      </div>

      <div className="gantt-wrap">
        <div className="gantt-sidebar">
          <div className="gantt-header">Задача</div>
          {tasks.map(task => {
            const assignee = users.find(u => u.id === task.assignee);
            return (
              <div key={task.id} className="gantt-row-label" onClick={() => setEditTask(task)}
                style={{ cursor: 'pointer', background: editTask?.id === task.id ? 'var(--primary-bg)' : '' }}>
                <div className="gantt-task-title">{task.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text2)', display: 'flex', gap: 6 }}>
                  <span>{assignee?.name}</span>
                  <span style={{ color: STATUS_COLORS[task.status] }}>●</span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="gantt-chart">
          <div className="gantt-header" style={{ padding: 0 }}>
            {cells.slice(0, 30).map((d, i) => (
              <div key={i} className="gantt-header-cell" style={{ width: SCALE_OPTIONS[scale]?.width || 80 }}>
                {scale === 'month'
                  ? d.toLocaleString('ru', { month: 'short' })
                  : `${d.getDate()}.${d.getMonth() + 1}`}
              </div>
            ))}
          </div>
          {tasks.map(task => {
            const start = toDays(task.created);
            const dur = task.deadline ? toDays(task.deadline) - start : 14;
            const left = Math.max(0, start) / totalDays * 100;
            const width = Math.min(dur, totalDays - Math.max(0, start)) / totalDays * 100;
            return (
              <div key={task.id} className="gantt-row">
                <div className="gantt-bar" style={{
                  left: `${left}%`, width: `${Math.max(width, 2.5)}%`,
                  background: STATUS_COLORS[task.status],
                  cursor: 'ew-resize', opacity: dragging === task.id ? .7 : 1,
                }}
                  onMouseDown={(e) => handleBarDrag(e, task)}>
                  <span className="gantt-bar-label">{task.deadline || '—'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showAdd && (
        <div className="lightbox" onClick={() => setShowAdd(false)}>
          <div className="lightbox-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <h3 style={{ marginBottom: 16 }}>Новая задача</h3>
            <div className="form-group"><label>Название</label><input value={form.title} onChange={e => setForm({...form, title: e.target.value})} autoFocus /></div>
            <div className="form-group"><label>Описание</label><input value={form.desc} onChange={e => setForm({...form, desc: e.target.value})} /></div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div className="form-group" style={{ flex: 1 }}><label>Начало</label><input type="date" value={form.created} onChange={e => setForm({...form, created: e.target.value})} /></div>
              <div className="form-group" style={{ flex: 1 }}><label>Срок</label><input type="date" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} /></div>
            </div>
            <div className="form-group"><label>Исполнитель</label>
              <select value={form.assignee} onChange={e => setForm({...form, assignee: e.target.value})}>
                {users.filter(u => u.id >= 1).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="btn-primary" onClick={addTask}>Создать</button>
              <button className="btn-sm" onClick={() => setShowAdd(false)}>Отмена</button>
            </div>
          </div>
        </div>
      )}

      {editTask && (
        <div className="lightbox" onClick={() => setEditTask(null)}>
          <div className="lightbox-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 450 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3>Редактирование</h3>
              <button className="btn-sm" style={{ color: 'var(--red)' }} onClick={() => deleteTask(editTask.id)}>🗑️</button>
            </div>
            <div className="form-group"><label>Название</label><input value={editTask.title} onChange={e => updateTask(editTask.id, { title: e.target.value })} /></div>
            <div className="form-group"><label>Описание</label><input value={editTask.desc} onChange={e => updateTask(editTask.id, { desc: e.target.value })} /></div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div className="form-group" style={{ flex: 1 }}><label>Начало</label><input type="date" value={editTask.created} onChange={e => updateTask(editTask.id, { created: e.target.value })} /></div>
              <div className="form-group" style={{ flex: 1 }}><label>Срок</label><input type="date" value={editTask.deadline} onChange={e => updateTask(editTask.id, { deadline: e.target.value })} /></div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div className="form-group" style={{ flex: 1 }}><label>Статус</label>
                <select value={editTask.status} onChange={e => updateTask(editTask.id, { status: e.target.value })}>
                  <option value="todo">К выполнению</option>
                  <option value="progress">В работе</option>
                  <option value="done">Готово</option>
                </select>
              </div>
              <div className="form-group" style={{ flex: 1 }}><label>Исполнитель</label>
                <select value={editTask.assignee} onChange={e => updateTask(editTask.id, { assignee: Number(e.target.value) })}>
                  {users.filter(u => u.id >= 1).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="btn-sm" onClick={() => setEditTask(null)}>Закрыть</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
