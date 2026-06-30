import { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { api } from '../lib/api';
import { users } from '../data/mockData';

function loadData() {
  try { const d = JSON.parse(localStorage.getItem('kanban_data')); if (d && d.columns && d.tasks) return d; } catch {}
  return {
    columns: [
      { id: 'todo', label: 'К выполнению', color: '#f3f4f6' },
      { id: 'progress', label: 'В работе', color: '#fffbeb' },
      { id: 'done', label: 'Готово', color: '#f0fdf4' },
    ],
    tasks: [
      { id: 1, title: 'Рефакторинг модуля авторизации', desc: 'Переписать auth-модуль на JWT с refresh-токенами.', priority: 'low', status: 'todo', assignee: 6, deadline: '2026-08-01', subtasks: [] },
      { id: 2, title: 'Внедрить систему уведомлений', desc: 'Email и push-уведомления для задач и сообщений.', priority: 'high', status: 'progress', assignee: 6, deadline: '2026-07-15', subtasks: [{ title: 'Настроить очередь задач', done: true }, { title: 'Интеграция с SMTP', done: false }] },
      { id: 3, title: 'Сверка квартальных отчётов', desc: 'Подготовить отчёт по расходам и доходам за Q2.', priority: 'medium', status: 'progress', assignee: 4, deadline: '2026-07-10', subtasks: [] },
      { id: 4, title: 'Наём фронтенд-разработчика', desc: 'Провести собеседования, найти senior React-разработчика.', priority: 'medium', status: 'progress', assignee: 5, deadline: '2026-07-31', subtasks: [{ title: 'Разместить вакансию', done: true }, { title: 'Отобрать резюме', done: true }] },
      { id: 5, title: 'Разработать API чатов', desc: 'REST API для чатов с WebSocket.', priority: 'high', status: 'done', assignee: 3, deadline: '2026-07-01', subtasks: [{ title: 'Спроектировать схему БД', done: true }, { title: 'Написать CRUD для сообщений', done: true }, { title: 'Подключить Socket.IO', done: true }] },
    ],
  };
}

const PRIORITIES = { high: 'Высокий', medium: 'Средний', low: 'Низкий' };
const PRIORITY_COLORS = { high: '#ef4444', medium: '#f59e0b', low: '#6b7280' };

export default function Kanban() {
  const [data, setData] = useState(loadData);
  const [dragOverCol, setDragOverCol] = useState(null);
  const [showTask, setShowTask] = useState(null);
  const [showAdd, setShowAdd] = useState(null);
  const [form, setForm] = useState({ title: '', desc: '', priority: 'medium', assignee: 1, deadline: '' });
  const dragRef = useRef(null);

  const update = (next) => {
    setData(next);
    localStorage.setItem('kanban_data', JSON.stringify(next));
    api.put('/kanban', next).catch(() => {});
  };

  const handleDragStart = (e, task) => {
    dragRef.current = task;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.id);
  };

  const handleDragOver = (e, colId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCol(colId);
  };

  const handleDrop = (e, colId) => {
    e.preventDefault();
    const task = dragRef.current;
    if (!task || task.status === colId) { setDragOverCol(null); dragRef.current = null; return; }
    update({ ...data, tasks: data.tasks.map(t => t.id === task.id ? { ...t, status: colId } : t) });
    setDragOverCol(null);
    dragRef.current = null;
  };

  const addTask = (colId) => {
    if (!form.title.trim()) return;
    const task = { id: Date.now(), title: form.title.trim(), desc: form.desc.trim(), priority: form.priority, status: colId, assignee: Number(form.assignee), deadline: form.deadline || new Date().toISOString().slice(0, 10), subtasks: [] };
    update({ ...data, tasks: [...data.tasks, task] });
    setForm({ title: '', desc: '', priority: 'medium', assignee: 1, deadline: '' });
    setShowAdd(null);
  };

  const addColumn = () => update({ ...data, columns: [...data.columns, { id: 'col_' + Date.now(), label: 'Новая колонка', color: '#f0f0ff' }] });

  return (
    <Layout title="Канбан">
      <div style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: 'var(--text2)' }}>Задач: {data.tasks.length}</span>
        <div className="sep" />
        <button className="btn-sm" onClick={addColumn}>➕ Колонка</button>
      </div>

      <div className="kanban-board">
        {data.columns.map(col => {
          const colTasks = data.tasks.filter(t => t.status === col.id);
          return (
            <div key={col.id} className="kanban-col"
              onDragOver={e => handleDragOver(e, col.id)}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={e => handleDrop(e, col.id)}
              style={{ opacity: dragOverCol === col.id ? .85 : 1 }}>
              <div className="kanban-col-header" style={{ background: col.color }}>
                <span>{col.label}</span>
                <span className="kanban-count">{colTasks.length}</span>
              </div>
              <div className="kanban-cards">
                {colTasks.length === 0 && (
                  <div style={{ padding: 20, textAlign: 'center', fontSize: 12, color: 'var(--text2)' }}>
                    Нет задач
                  </div>
                )}
                {colTasks.map(task => {
                  const assignee = users.find(u => u.id === task.assignee);
                  return (
                    <div key={task.id} className="kanban-card" draggable
                      onDragStart={e => handleDragStart(e, task)}
                      onDragEnd={() => { setDragOverCol(null); dragRef.current = null; }}
                      onClick={() => setShowTask(task)}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                        <h4>{task.title}</h4>
                        <span style={{ fontSize: 10, color: PRIORITY_COLORS[task.priority], whiteSpace: 'nowrap', fontWeight: 600 }}>
                          {PRIORITIES[task.priority]}
                        </span>
                      </div>
                      {task.desc && (
                        <p style={{ fontSize: 12, color: 'var(--text2)', marginTop: 6, lineHeight: 1.4 }}>{task.desc}</p>
                      )}
                      <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'var(--text2)' }}>
                        <span>👤 {assignee?.name || '—'}</span>
                        <span>📅 {task.deadline}</span>
                      </div>
                      {task.subtasks?.length > 0 && (
                        <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text2)' }}>
                          {task.subtasks.filter(s => s.done).length}/{task.subtasks.length} ✓
                        </div>
                      )}
                    </div>
                  );
                })}
                <button className="btn-sm" style={{ width: '100%', marginTop: 4, borderStyle: 'dashed', color: 'var(--text2)' }} onClick={() => setShowAdd(col.id)}>+ Добавить</button>
              </div>
            </div>
          );
        })}
      </div>

      {showAdd && (
        <div className="lightbox" onClick={() => setShowAdd(null)}>
          <div className="lightbox-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <h3 style={{ marginBottom: 16, fontSize: 18 }}>Новая задача</h3>
            <div className="form-group"><label>Название</label><input value={form.title} onChange={e => setForm({...form, title: e.target.value})} autoFocus /></div>
            <div className="form-group"><label>Описание</label><textarea value={form.desc} onChange={e => setForm({...form, desc: e.target.value})} rows={2} style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, outline: 'none', fontSize: 14, resize: 'vertical', boxSizing: 'border-box', background: 'var(--bg)' }} /></div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div className="form-group" style={{ flex: 1 }}><label>Приоритет</label>
                <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>
                  {Object.entries(PRIORITIES).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ flex: 1 }}><label>Исполнитель</label>
                <select value={form.assignee} onChange={e => setForm({...form, assignee: e.target.value})}>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group"><label>Срок</label><input type="date" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} /></div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="btn-primary" onClick={() => addTask(showAdd)}>Создать</button>
              <button className="btn-sm" onClick={() => setShowAdd(null)}>Отмена</button>
            </div>
          </div>
        </div>
      )}

      {showTask && (
        <div className="lightbox" onClick={() => setShowTask(null)}>
          <div className="lightbox-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div className="tabs" style={{ marginBottom: 0 }}>
                <span className="tab active" style={{ padding: '6px 14px', fontSize: 12 }}>Задача</span>
              </div>
              <button className="btn-sm" style={{ color: 'var(--red)' }} onClick={() => { update({ ...data, tasks: data.tasks.filter(t => t.id !== showTask.id) }); setShowTask(null); }}>🗑️</button>
            </div>
            <input value={showTask.title}
              onChange={e => { const updated = { ...data, tasks: data.tasks.map(t => t.id === showTask.id ? { ...t, title: e.target.value } : t) }; setData(updated); localStorage.setItem('kanban_data', JSON.stringify(updated)); }}
              style={{ fontSize: 18, fontWeight: 700, width: '100%', border: 'none', outline: 'none', background: 'transparent', marginBottom: 8 }} />
            <textarea value={showTask.desc}
              onChange={e => { const updated = { ...data, tasks: data.tasks.map(t => t.id === showTask.id ? { ...t, desc: e.target.value } : t) }; setData(updated); localStorage.setItem('kanban_data', JSON.stringify(updated)); }}
              placeholder="Описание..."
              style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 8, outline: 'none', fontSize: 13, color: 'var(--text2)', resize: 'vertical', minHeight: 60, padding: 10, background: 'var(--bg)', boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <select value={showTask.status}
                onChange={e => { const updated = { ...data, tasks: data.tasks.map(t => t.id === showTask.id ? { ...t, status: e.target.value } : t) }; setShowTask({ ...showTask, status: e.target.value }); setData(updated); localStorage.setItem('kanban_data', JSON.stringify(updated)); }}
                style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, outline: 'none', background: 'var(--surface)' }}>
                {data.columns.map(col => <option key={col.id} value={col.id}>{col.label}</option>)}
              </select>
              <select value={showTask.priority}
                onChange={e => { const updated = { ...data, tasks: data.tasks.map(t => t.id === showTask.id ? { ...t, priority: e.target.value } : t) }; setShowTask({ ...showTask, priority: e.target.value }); setData(updated); localStorage.setItem('kanban_data', JSON.stringify(updated)); }}
                style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, outline: 'none', background: 'var(--surface)' }}>
                {Object.entries(PRIORITIES).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 12 }}>
              👤 Исполнитель: {users.find(u => u.id === showTask.assignee)?.name || '—'} • 📅 Срок: {showTask.deadline || '—'}
            </div>
            <button className="btn-sm" style={{ marginTop: 12, width: '100%' }} onClick={() => setShowTask(null)}>Закрыть</button>
          </div>
        </div>
      )}
    </Layout>
  );
}
