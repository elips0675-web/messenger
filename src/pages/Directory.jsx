import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

function loadUsers() {
  try { const d = JSON.parse(localStorage.getItem('admin_users')); if (d?.length) return d; } catch {}
  return null;
}

const DEMO_USERS = [
  { id: 1, name: 'Алексей Волков', email: 'alex@corp.ru', title: 'CEO', dept: 1, phone: '+7 (999) 111-11-11', online: true, role: 'admin' },
  { id: 2, name: 'Елена Соколова', email: 'elena@corp.ru', title: 'Team Lead', dept: 2, phone: '+7 (999) 222-22-22', online: true, role: 'manager' },
  { id: 3, name: 'Иван Петров', email: 'ivan@corp.ru', title: 'Backend Dev', dept: 2, phone: '+7 (999) 333-33-33', online: false, lastSeen: 'был 2ч назад', role: 'user' },
  { id: 4, name: 'Мария Иванова', email: 'maria@corp.ru', title: 'Главный бухгалтер', dept: 3, phone: '+7 (999) 444-44-44', online: true, role: 'manager' },
  { id: 5, name: 'Дмитрий Козлов', email: 'dmitry@corp.ru', title: 'HR Director', dept: 4, phone: '+7 (999) 555-55-55', online: false, lastSeen: 'был вчера', role: 'manager' },
  { id: 6, name: 'Анна Новикова', email: 'anna@corp.ru', title: 'Frontend Dev', dept: 2, phone: '+7 (999) 666-66-66', online: true, role: 'user' },
  { id: 7, name: 'Сергей Морозов', email: 'sergey@corp.ru', title: 'Бухгалтер', dept: 3, phone: '+7 (999) 777-77-77', online: false, lastSeen: 'был 5ч назад', role: 'user' },
  { id: 8, name: 'Ольга Белова', email: 'olga@corp.ru', title: 'HR Specialist', dept: 4, phone: '+7 (999) 888-88-88', online: true, role: 'user' },
];

const COLORS = ['#2b7ef9', '#f59e0b', '#22c55e', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Directory() {
  const navigate = useNavigate();
  const [users, setUsers] = useState(() => loadUsers() || DEMO_USERS);

  const openChat = (targetUser) => {
    const me = JSON.parse(localStorage.getItem('user') || '{}');
    if (!me.id) { navigate('/chats'); return; }
    const saved = JSON.parse(localStorage.getItem('chats_data') || '[]');
    const existing = saved.find(c => c.type === 'personal' && c.members?.includes(me.id) && c.members?.includes(targetUser.id));
    if (existing) { navigate(`/chat/${existing.id}`); return; }
    const newChat = { id: Date.now(), name: targetUser.name, type: 'personal', avatar: targetUser.name?.slice(0, 2).toUpperCase(), lastMsg: '', lastTime: '', unread: 0, members: [me.id, targetUser.id], userId: targetUser.id, messages: [] };
    localStorage.setItem('chats_data', JSON.stringify([...saved, newChat]));
    navigate(`/chat/${newChat.id}`);
  };
  const [query, setQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');

  const depts = [
    { id: 1, name: 'Руководство' },
    { id: 2, name: 'IT-отдел' },
    { id: 3, name: 'Бухгалтерия' },
    { id: 4, name: 'HR' },
  ];

  const filtered = users.filter(u => {
    const mq = !query || u.name?.toLowerCase().includes(query.toLowerCase()) || u.email?.toLowerCase().includes(query.toLowerCase());
    const md = deptFilter === 'all' || u.dept === Number(deptFilter);
    return mq && md;
  });

  const grouped = depts.map(d => ({ ...d, users: filtered.filter(u => u.dept === d.id) })).filter(g => g.users.length > 0);

  return (
    <Layout title="Справочник сотрудников">
      <div className="dir-filters">
        <input className="dir-search" placeholder="🔍 Поиск по имени или email..." value={query} onChange={e => setQuery(e.target.value)} />
        <select className="dir-select" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
          <option value="all">Все отделы</option>
          {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>
      <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>Найдено: {filtered.length} чел.</div>
      {grouped.map(dept => (
        <div key={dept.id} className="dept-section">
          <h3>{dept.name} — {dept.users.length} чел.</h3>
          <div className="user-grid">
            {dept.users.map(user => {
              const color = COLORS[(user.name?.charCodeAt(0) || 0) % COLORS.length];
              return (
                <div key={user.id} className="user-card">
                  <div className="user-avatar" style={{ background: color }}>
                    {user.name?.[0] || '?'}
                    {user.online && <span className="online-dot-lg" />}
                  </div>
                  <h4>{user.name}</h4>
                  <div className="role">{user.title || user.role}</div>
                  <div className="contact">📧 {user.email}</div>
                  <div className="contact">📞 {user.phone || '—'}</div>
                  <div className="dept-tag">{depts.find(d => d.id === user.dept)?.name || dept.name}</div>
                  <div style={{ fontSize: 11, color: user.online ? 'var(--green)' : 'var(--text2)', marginTop: 4 }}>
                    {user.online ? '● в сети' : user.lastSeen || 'не в сети'}
                  </div>
                  <button className="msg-user-btn" onClick={() => openChat(user)}>💬 Написать</button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
          <p>Ничего не найдено</p>
        </div>
      )}
    </Layout>
  );
}
