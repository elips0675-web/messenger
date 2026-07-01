import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../lib/api';
import { useToast } from '../components/Toast';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';

export default function WorkflowBuilder() {
  const { id } = useParams();
  const addToast = useToast();
  const navigate = useNavigate();
  const [wf, setWf] = useState(null);
  const [users, setUsers] = useState([]);
  const [stageName, setStageName] = useState('');
  const [stageApprover, setStageApprover] = useState('');
  const [submitForm, setSubmitForm] = useState({ title: '', description: '' });
  const [showSubmit, setShowSubmit] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/workflows/${id}`),
      api.get('/corporate/users').catch(() => []),
    ]).then(([w, u]) => {
      if (w) setWf(w);
      if (u) setUsers(u);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  const addStage = async () => {
    if (!stageName.trim() || !stageApprover) return;
    try {
      const s = await api.post(`/workflows/${id}/stages`, { name: stageName, approver_id: Number(stageApprover) });
      setWf(prev => ({ ...prev, stages: [...(prev.stages || []), s] }));
      setStageName(''); setStageApprover('');
      addToast('Этап добавлен', 'success');
    } catch { addToast('Ошибка', 'error'); }
  };

  const removeStage = async (stageId) => {
    try {
      await api.delete(`/workflows/${id}/stages/${stageId}`);
      setWf(prev => ({ ...prev, stages: prev.stages.filter(s => s.id !== stageId) }));
      addToast('Этап удалён', 'success');
    } catch { addToast('Ошибка', 'error'); }
  };

  const submitRequest = async () => {
    if (!submitForm.title.trim()) return;
    try {
      await api.post('/workflows/requests', { workflow_id: Number(id), ...submitForm });
      setShowSubmit(false);
      setSubmitForm({ title: '', description: '' });
      addToast('Заявка отправлена на согласование', 'success');
    } catch { addToast('Ошибка', 'error'); }
  };

  if (loading) return <Layout title="Загрузка..."><Loading /></Layout>;
  if (!wf) return <Layout title="Не найдено"><EmptyState icon="❌" message="Шаблон не найден" /></Layout>;

  return (
    <Layout title={`${wf.icon || '📋'} ${wf.name}`} showBack onBack={() => navigate('/workflows')}>
      <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>{wf.description}</p>

      <button className="btn-primary" style={{ marginBottom: 16 }} onClick={() => setShowSubmit(true)}>
        📄 Создать заявку
      </button>

      {showSubmit && (
        <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 16, background: 'var(--surface)' }}>
          <h4 style={{ marginBottom: 12 }}>Новая заявка</h4>
          <div className="form-group"><label>Заголовок</label><input value={submitForm.title} onChange={e => setSubmitForm({...submitForm, title: e.target.value})} autoFocus /></div>
          <div className="form-group"><label>Описание</label><textarea value={submitForm.description} onChange={e => setSubmitForm({...submitForm, description: e.target.value})} rows={3} /></div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-primary" onClick={submitRequest}>Отправить</button>
            <button className="btn-sm" onClick={() => setShowSubmit(false)}>Отмена</button>
          </div>
        </div>
      )}

      <h5 style={{ marginBottom: 8 }}>Этапы согласования</h5>
      {(wf.stages || []).map((s, i) => (
        <div key={s.id} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', marginBottom: 6, background: 'var(--surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontWeight: 600, fontSize: 13 }}>#{i + 1}</span> {s.name}
            <div style={{ fontSize: 12, color: 'var(--text2)' }}>👤 {s.approver_name} {s.approver_title && `(${s.approver_title})`}</div>
          </div>
          <button className="btn-sm" style={{ color: 'var(--red)' }} onClick={() => removeStage(s.id)}>🗑️</button>
        </div>
      ))}

      <div style={{ border: '1px dashed var(--border)', borderRadius: 8, padding: 12, marginTop: 12 }}>
        <h5 style={{ marginBottom: 8 }}>+ Добавить этап</h5>
        <div className="form-group"><label>Название этапа</label><input value={stageName} onChange={e => setStageName(e.target.value)} placeholder="Например: Проверка руководителем" /></div>
        <div className="form-group"><label>Согласующий</label>
          <select value={stageApprover} onChange={e => setStageApprover(e.target.value)}>
            <option value="">Выберите сотрудника</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.title || u.role})</option>)}
          </select>
        </div>
        <button className="btn-primary" onClick={addStage}>➕ Добавить</button>
      </div>
    </Layout>
  );
}
