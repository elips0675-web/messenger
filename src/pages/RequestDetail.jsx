import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../lib/api';
import { useToast } from '../components/Toast';
import StatusBadge from '../components/StatusBadge';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';

export default function RequestDetail() {
  const { id } = useParams();
  const addToast = useToast();
  const navigate = useNavigate();
  const [req, setReq] = useState(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/workflows/requests/${id}`).then(d => { if (d) setReq(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  const handleAction = async (action) => {
    try {
      const updated = await api.post(`/workflows/requests/${id}/approve`, { action, comment });
      setReq(updated);
      addToast(action === 'approved' ? '✅ Согласовано' : '❌ Отклонено', 'success');
    } catch (e) {
      addToast(e.message || 'Ошибка', 'error');
    }
  };

  if (loading) return <Layout title="Загрузка..."><Loading /></Layout>;
  if (!req) return <Layout title="Не найдено"><EmptyState icon="❌" message="Заявка не найдена" /></Layout>;

  const myPending = (req.approvals || []).find(a => a.status === 'pending');

  return (
    <Layout title={`${req.workflow_icon || '📄'} ${req.title}`} showBack onBack={() => navigate('/workflows')}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 13, color: 'var(--text2)' }}>{req.workflow_name}</span>
        <StatusBadge status={req.status} />
      </div>
      <p style={{ fontSize: 14, margin: '8px 0' }}>{req.description}</p>
      <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 16 }}>
        От: {req.requester_name} • {req.created_at?.slice(0, 10)}
      </div>

      <h5 style={{ marginBottom: 8, fontSize: 14 }}>Этапы согласования</h5>
      {(req.approvals || []).map(a => (
        <div key={a.id} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', marginBottom: 6, background: 'var(--surface)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontWeight: 600, fontSize: 13 }}>#{a.step_order}</span> {a.stage_name}
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>👤 {a.approver_name} {a.approver_title && `(${a.approver_title})`}</div>
            </div>
            <StatusBadge status={a.status} />
          </div>
          {a.comment && <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4, fontStyle: 'italic' }}>«{a.comment}»</div>}
          {a.decided_at && <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{a.decided_at?.slice(0, 16)}</div>}
        </div>
      ))}

      {req.status === 'pending' && myPending && (
        <div style={{ marginTop: 20, border: '1px solid var(--border)', borderRadius: 12, padding: 16, background: 'var(--surface)' }}>
          <h5 style={{ marginBottom: 8 }}>Ваше решение</h5>
          <div className="form-group"><label>Комментарий (необязательно)</label>
            <textarea value={comment} onChange={e => setComment(e.target.value)} rows={2} placeholder="Комментарий..." />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-primary" style={{ background: '#22c55e' }} onClick={() => handleAction('approved')}>✅ Согласовать</button>
            <button className="btn-primary" style={{ background: '#ef4444' }} onClick={() => handleAction('rejected')}>❌ Отклонить</button>
          </div>
        </div>
      )}
    </Layout>
  );
}
