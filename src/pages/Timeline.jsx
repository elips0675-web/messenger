import { useState, useEffect } from 'react';
import Layout from '../components/Layout';

export default function Timeline() {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    try {
      const d = JSON.parse(localStorage.getItem('timeline_tasks'));
      if (d?.length) setTasks(d);
      else setTasks([
        { id: 1, title: 'Разработать API чатов', deadline: '2026-07-01', status: 'done' },
        { id: 2, title: 'Внедрить уведомления', deadline: '2026-07-15', status: 'progress' },
        { id: 3, title: 'Сверка отчётов Q2', deadline: '2026-07-10', status: 'progress' },
        { id: 5, title: 'Рефакторинг авторизации', deadline: '2026-08-01', status: 'todo' },
      ]);
    } catch { setTasks([]); }
  }, []);

  const groups = [
    { label: 'Просрочено', icon: '🔥', color: '#ef4444', tasks: tasks.filter(t => t.deadline && t.deadline < new Date().toISOString().slice(0, 10) && t.status !== 'done') },
    { label: 'Эта неделя', icon: '📅', color: '#f59e0b', tasks: tasks.filter(t => t.deadline && t.deadline >= new Date().toISOString().slice(0, 10) && t.deadline <= new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)) },
    { label: 'Этот месяц', icon: '📅', color: '#2b7ef9', tasks: tasks.filter(t => t.deadline && t.deadline > new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10) && t.deadline <= new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().slice(0, 10)) },
    { label: 'Будущее', icon: '📅', color: '#8b5cf6', tasks: tasks.filter(t => t.deadline && t.deadline > new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().slice(0, 10)) },
    { label: 'Без срока', icon: '📅', color: '#6b7280', tasks: tasks.filter(t => !t.deadline) },
  ];

  return (
    <Layout title="Сроки">
      <div className="timeline">
        {groups.filter(g => g.tasks.length > 0).map(group => (
          <div key={group.label} className="tl-section">
            <div className="tl-section-header">
              <span className="tl-icon">{group.icon}</span>
              <h3 style={{ color: group.color }}>{group.label}</h3>
              <span className="tl-count">{group.tasks.length}</span>
            </div>
            <div className="tl-list">
              {group.tasks.map(t => (
                <div key={t.id} className="tl-item">
                  <div className="tl-item-lead">
                    <strong>{t.title}</strong>
                    <span className={`priority-tag status-${t.status}`}>
                      {t.status === 'done' ? '✅' : t.status === 'progress' ? '🔄' : '📋'}
                    </span>
                  </div>
                  <div className="tl-item-meta">
                    <span>📅 {t.deadline || '—'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
}
