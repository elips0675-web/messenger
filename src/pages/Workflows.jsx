import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../lib/api';
import { useToast } from '../components/Toast';
import StatusBadge from '../components/StatusBadge';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';

export default function Workflows() {
  const addToast = useToast();
  const navigate = useNavigate();
  const [tab, setTab] = useState('templates');
  const [templates, setTemplates] = useState([]);
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [showNewTmpl, setShowNewTmpl] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', icon: '📋' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/corporate/users').then(setUsers).catch(() => {});
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tmpl, reqs] = await Promise.all([
        api.get('/workflows'),
        api.get('/workflows/requests'),
      ]);
      if (tmpl) setTemplates(tmpl);
      if (reqs) setRequests(reqs);
    } catch (e) {
      addToast('Ошибка загрузки', 'error');
    }
    setLoading(false);
  };

  const createTemplate = async () => {
    if (!form.name.trim()) return;
    try {
      const t = await api.post('/workflows', form);
      setTemplates(prev => [t, ...prev]);
      setShowNewTmpl(false);
      setForm({ name: '', description: '', icon: '📋' });
      addToast('Шаблон создан', 'success');
    } catch { addToast('Ошибка', 'error'); }
  };

  const deleteTemplate = async (id) => {
    try {
      await api.delete(`/workflows/${id}`);
      setTemplates(prev => prev.filter(t => t.id !== id));
      addToast('Шаблон удалён', 'success');
    } catch { addToast('Ошибка удаления', 'error'); }
  };

  const handleApprove = async (id, action) => {
    try {
      const r = await api.post(`/workflows/requests/${id}/approve`, { action, comment: '' });
      setRequests(prev => prev.map(x => x.id === id ? r : x));
      addToast(action === 'approved' ? '✅ Согласовано' : '❌ Отклонено', 'success');
    } catch { addToast('Ошибка', 'error'); }
  };

  return (
    <Layout title="Согласования">
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid var(--border)' }}>
        {['templates', 'requests'].map(t => (
          <div key={t} className={`tab ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
            style={{ padding: '8px 16px', cursor: 'pointer', borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent', color: tab === t ? 'var(--accent)' : 'var(--text2)', fontWeight: tab === t ? 600 : 400 }}>
            {t === 'templates' ? '📋 Шаблоны' : '📄 Заявки'}
          </div>
        ))}
      </div>

      {tab === 'templates' && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button className="btn-primary" onClick={() => setShowNewTmpl(!showNewTmpl)}>➕ Шаблон</button>
          </div>

          {showNewTmpl && (
            <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 16, background: 'var(--surface)' }}>
              <h4 style={{ marginBottom: 12 }}>Новый шаблон</h4>
              <div className="form-group"><label>Название</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} autoFocus /></div>
              <div className="form-group"><label>Описание</label><textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} /></div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-primary" onClick={createTemplate}>Создать</button>
                <button className="btn-sm" onClick={() => setShowNewTmpl(false)}>Отмена</button>
              </div>
            </div>
          )}

          {loading ? <Loading /> : templates.length === 0 ? (
            <EmptyState icon="📋" message="Нет шаблонов согласования" />
          ) : templates.map(t => (
            <div key={t.id} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', marginBottom: 8, background: 'var(--surface)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => navigate(`/workflows/${t.id}`)}>
                  <h4 style={{ fontSize: 15, margin: 0 }}>{t.icon} {t.name}</h4>
                  {t.description && <p style={{ fontSize: 13, color: 'var(--text2)', margin: '4px 0 0' }}>{t.description}</p>}
                  <span style={{ fontSize: 12, color: 'var(--text2)' }}>{t.stages_count || 0} этапов</span>
                </div>
                <button className="btn-sm" style={{ color: 'var(--red)' }} onClick={() => deleteTemplate(t.id)}>🗑️</button>
              </div>
            </div>
          ))}
        </>
      )}

      {tab === 'requests' && (
        loading ? <Loading /> : requests.length === 0 ? (
          <EmptyState icon="📄" message="Заявок пока нет" />
        ) : requests.map(r => (
          <div key={r.id} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', marginBottom: 8, cursor: 'pointer', background: 'var(--surface)' }}
            onClick={() => navigate(`/workflows/requests/${r.id}`)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span>{r.workflow_icon} {r.workflow_name}</span>
                  <StatusBadge status={r.status} />
                </div>
                <h4 style={{ fontSize: 14, margin: 0 }}>{r.title}</h4>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
                  {r.requester_name} • {r.created_at?.slice(0, 10)}
                  {r.pending_count > 0 && ` • ⏳ ${r.pending_count} ожидает`}
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </Layout>
  );
}
