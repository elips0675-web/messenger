import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../lib/api';
import { departments, actionLog, tasks, chats } from '../data/mockData';

const ROLE_OPTIONS = ['admin', 'manager', 'user'];
const ROLE_COLORS = { admin: '#ef4444', manager: '#f59e0b', user: '#2b7ef9' };
const ROLE_LABELS = { admin: 'Админ', manager: 'Руководитель', user: 'Сотрудник' };

export default function Admin() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const [depts, setDepts] = useState(departments.map(d => ({ ...d })));
  const [campaignForm, setCampaignForm] = useState({ title: '', body: '', channel: 'push', target: 'all' });
  const [campaigns, setCampaigns] = useState([]);
  const [campaignMsg, setCampaignMsg] = useState('');
  const [showAddUser, setShowAddUser] = useState(false);
  const [userForm, setUserForm] = useState({ name: '', email: '', title: '', dept_id: 1, role: 'user', phone: '' });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role !== 'admin') navigate('/chats', { replace: true });
    api.get('/admin/users').then(setUsers).catch(() => {
      try { const d = JSON.parse(localStorage.getItem('admin_users')); if (d?.length) setUsers(d); } catch {}
    });
    api.get('/admin/departments').then(setDepts).catch(() => {});
    api.get('/admin/campaigns').then(setCampaigns).catch(() => {});
  }, []);

  const saveUsers = (next) => { setUsers(next); localStorage.setItem('admin_users', JSON.stringify(next)); };

  const addUser = async () => {
    if (!userForm.name.trim()) return;
    try {
      const newUser = await api.post('/admin/users', userForm);
      setUsers(prev => [...prev, newUser]);
    } catch {
      const maxId = Math.max(...users.map(u => u.id), 0);
      saveUsers([...users, { id: maxId + 1, ...userForm, online: false, lastSeen: 'только что', blocked: false }]);
    }
    setUserForm({ name: '', email: '', title: '', dept_id: 1, role: 'user', phone: '' });
    setShowAddUser(false);
  };

  const updateUser = async (id, changes) => {
    saveUsers(users.map(u => u.id === id ? { ...u, ...changes } : u));
    try { await api.put(`/admin/users/${id}`, changes); } catch {}
  };

  const deleteUser = async (id) => {
    saveUsers(users.filter(u => u.id !== id));
    try { await api.delete(`/admin/users/${id}`); } catch {}
  };

  const sendCampaign = async () => {
    if (!campaignForm.title || !campaignForm.body) return;
    try {
      const data = await api.post('/admin/campaigns', campaignForm);
      setCampaigns([{ id: data.id, title: campaignForm.title, body: campaignForm.body, target: campaignForm.target, channel: campaignForm.channel, status: 'sent', sentAt: new Date().toLocaleDateString('ru-RU') }, ...campaigns]);
      setCampaignForm({ title: '', body: '', channel: 'push', target: 'all' });
      setCampaignMsg('✅ Кампания отправлена');
      setTimeout(() => setCampaignMsg(''), 3000);
    } catch { setCampaignMsg('❌ Ошибка'); }
  };

  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.online).length;
  const totalTasks = tasks.length;
  const totalChats = chats.length;

  return (
    <Layout title="Панель администратора">
      <div className="tabs" style={{ flexWrap: 'wrap' }}>
        {[
          { key: 'dashboard', label: '📊 Дашборд' }, { key: 'users', label: `👥 Пользователи (${totalUsers})` },
          { key: 'departments', label: `🏢 Отделы (${depts.length})` }, { key: 'messaging', label: '📨 Рассылки' },
          { key: 'logs', label: '📋 Журнал' }, { key: 'sso', label: '🔐 SSO/LDAP' },
        ].map(t => (
          <div key={t.key} className={`tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>{t.label}</div>
        ))}
      </div>

      {tab === 'dashboard' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          {[
            { label: 'Пользователей', value: totalUsers, icon: '👥', color: '#2b7ef9' },
            { label: 'В сети', value: activeUsers, icon: '🟢', color: '#22c55e' },
            { label: 'Задач', value: totalTasks, icon: '✅', color: '#f59e0b' },
            { label: 'Чатов', value: totalChats, icon: '💬', color: '#8b5cf6' },
            { label: 'Отделов', value: depts.length, icon: '🏢', color: '#ec4899' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-icon" style={{ background: s.color + '20', color: s.color }}>{s.icon}</div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'users' && (
        <div>
          <button className="btn-primary" style={{ width: 'auto', padding: '8px 20px', marginBottom: 12 }} onClick={() => setShowAddUser(true)}>➕ Добавить</button>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Сотрудник</th><th>Email</th><th>Должность</th><th>Отдел</th><th>Роль</th><th></th></tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td><input value={u.name} onChange={e => updateUser(u.id, { name: e.target.value })} style={{ border: 'none', outline: 'none', background: 'transparent', fontWeight: 600 }} /></td>
                    <td style={{ fontSize: 13 }}>{u.email}</td>
                    <td style={{ fontSize: 13 }}>{u.title}</td>
                    <td style={{ fontSize: 13 }}>
                      <select value={u.dept_id || u.dept} onChange={e => updateUser(u.id, { dept_id: Number(e.target.value) })} style={{ fontSize: 12, border: 'none', outline: 'none', background: 'transparent' }}>
                        {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </td>
                    <td>
                      <select value={u.role || u.systemRole || 'user'} onChange={e => updateUser(u.id, { role: e.target.value })}
                        style={{ fontSize: 12, padding: '2px 6px', borderRadius: 6, border: '1px solid var(--border)' }}>
                        {ROLE_OPTIONS.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                      </select>
                    </td>
                    <td><button className="admin-action-btn" style={{ color: 'var(--red)' }} onClick={() => deleteUser(u.id)}>🗑️</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'departments' && (
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {depts.map(d => (
              <div key={d.id} className="dept-admin-card">
                <h4 style={{ fontSize: 16, fontWeight: 600 }}>{d.name}</h4>
                <p style={{ fontSize: 13, color: 'var(--text2)' }}>Руководитель: {d.head} • {d.user_count || users.filter(u => (u.dept_id || u.dept) === d.id).length} сотрудников</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'messaging' && (
        <div>
          {campaignMsg && <div style={{ padding: '8px 12px', background: campaignMsg.includes('✅') ? '#f0fdf4' : '#fef2f2', borderRadius: 8, marginBottom: 12, fontSize: 14 }}>{campaignMsg}</div>}
          <div className="card">
            <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Создать рассылку</h4>
            <input value={campaignForm.title} onChange={e => setCampaignForm({...campaignForm, title: e.target.value})} placeholder="Заголовок" style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 8, outline: 'none', fontSize: 14, marginBottom: 8, boxSizing: 'border-box' }} />
            <textarea value={campaignForm.body} onChange={e => setCampaignForm({...campaignForm, body: e.target.value})} placeholder="Текст..." rows={3} style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 8, outline: 'none', fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <select value={campaignForm.channel} onChange={e => setCampaignForm({...campaignForm, channel: e.target.value})} style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: 8 }}>
                <option value="push">Push</option><option value="email">Email</option>
              </select>
              <select value={campaignForm.target} onChange={e => setCampaignForm({...campaignForm, target: e.target.value} )} style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: 8 }}>
                <option value="all">Всем</option><option value="admins">Админам</option><option value="managers">Руководителям</option>
              </select>
              <button className="send-btn" onClick={sendCampaign}>📨 Отправить</button>
            </div>
          </div>
        </div>
      )}

      {tab === 'logs' && (
        <div className="activity-log">
          {actionLog.map(log => (
            <div key={log.id} className="activity-item">
              <div className="activity-dot" />
              <div className="activity-body"><strong>{users.find(x => x.id === log.userId)?.name}</strong> {log.action}<div className="activity-time">{log.time}</div></div>
            </div>
          ))}
        </div>
      )}

      {tab === 'sso' && (
        <div className="card">
          <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>🔐 SSO / LDAP</h4>
          <div className="form-group"><label>LDAP Сервер</label><input defaultValue="ldap.company.ru" /></div>
          <div className="form-group"><label>Base DN</label><input defaultValue="dc=company,dc=ru" /></div>
          <div className="form-group"><label>OAuth Провайдер</label>
            <select style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: 8 }}>
              <option>Google Workspace</option><option>Azure AD</option><option>Okta</option>
            </select>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text2)' }}>Настройки применяются после перезапуска сервера</p>
        </div>
      )}

      {showAddUser && (
        <div className="lightbox" onClick={() => setShowAddUser(false)}>
          <div className="lightbox-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <h3 style={{ marginBottom: 16 }}>Новый пользователь</h3>
            <div className="form-group"><label>Имя</label><input value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} autoFocus /></div>
            <div className="form-group"><label>Email</label><input value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} /></div>
            <div className="form-group"><label>Должность</label><input value={userForm.title} onChange={e => setUserForm({...userForm, title: e.target.value})} /></div>
            <div className="form-group"><label>Телефон</label><input value={userForm.phone} onChange={e => setUserForm({...userForm, phone: e.target.value})} /></div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div className="form-group"><label>Отдел</label>
                <select value={userForm.dept_id} onChange={e => setUserForm({...userForm, dept_id: Number(e.target.value)})}>
                  {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Роль</label>
                <select value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})}>
                  {ROLE_OPTIONS.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                </select>
              </div>
            </div>
            <button className="btn-primary" style={{ marginTop: 12 }} onClick={addUser}>Создать</button>
          </div>
        </div>
      )}
    </Layout>
  );
}
