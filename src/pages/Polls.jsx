import { useState } from 'react';
import Layout from '../components/Layout';
import { api } from '../lib/api';
import { useToast } from '../components/Toast';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';
import useFetch from '../lib/useFetch';

export default function Polls() {
  const addToast = useToast();
  const { data: polls, loading, setData: setPolls } = useFetch('/polls');
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', options: ['', ''], multiple_choice: false });
  const [expanded, setExpanded] = useState(null);

  const createPoll = async () => {
    if (!form.title.trim() || form.options.filter(o => o.trim()).length < 2) return;
    try {
      const p = await api.post('/polls', {
        title: form.title,
        description: form.description,
        options: form.options.filter(o => o.trim()),
        multiple_choice: form.multiple_choice,
      });
      setPolls(prev => [p, ...prev]);
      setShowNew(false);
      setForm({ title: '', description: '', options: ['', ''], multiple_choice: false });
      addToast('Опрос создан', 'success');
    } catch { addToast('Ошибка', 'error'); }
  };

  const vote = async (pollId, optionId) => {
    try {
      const updated = await api.post(`/polls/${pollId}/vote`, { option_id: optionId });
      setPolls(prev => prev.map(p => p.id === pollId ? {
        ...p,
        my_votes: updated.my_votes || [optionId],
        options: updated.options,
        total_votes: updated.total_votes,
      } : p));
      setExpanded(prev => prev === pollId ? pollId : null);
      if (expanded === pollId) setExpanded(pollId);
    } catch { addToast('Ошибка голосования', 'error'); }
  };

  const calcPct = (votes, total) => total > 0 ? Math.round(votes / total * 100) : 0;

  return (
    <Layout title="Опросы">
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button className="btn-primary" onClick={() => setShowNew(!showNew)}>➕ Опрос</button>
      </div>

      {showNew && (
        <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 16, background: 'var(--surface)' }}>
          <h4 style={{ marginBottom: 12 }}>Новый опрос</h4>
          <div className="form-group"><label>Вопрос</label><input value={form.title} onChange={e => setForm({...form, title: e.target.value})} autoFocus /></div>
          <div className="form-group"><label>Описание</label><textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} /></div>
          {form.options.map((opt, i) => (
            <div key={i} className="form-group"><label>Вариант {i + 1}</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={opt} onChange={e => { const o = [...form.options]; o[i] = e.target.value; setForm({...form, options: o}); }} style={{ flex: 1 }} />
                {form.options.length > 2 && <button className="btn-sm" style={{ color: 'var(--red)' }} onClick={() => setForm({...form, options: form.options.filter((_, j) => j !== i)})}>✕</button>}
              </div>
            </div>
          ))}
          <button className="btn-sm" style={{ marginBottom: 8 }} onClick={() => setForm({...form, options: [...form.options, '']})}>➕ Вариант</button>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 12 }}><input type="checkbox" checked={form.multiple_choice} onChange={e => setForm({...form, multiple_choice: e.target.checked})} /> Можно выбрать несколько вариантов</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-primary" onClick={createPoll}>Создать</button>
            <button className="btn-sm" onClick={() => setShowNew(false)}>Отмена</button>
          </div>
        </div>
      )}

      {loading ? <Loading /> : polls.length === 0 ? (
        <EmptyState icon="📊" message="Опросов пока нет" />
      ) : polls.map(poll => {
        const isExpanded = expanded === poll.id;
        const hasVoted = poll.my_votes?.length > 0;
        const isMC = poll.multiple_choice;
        const detailUrl = `/polls/${poll.id}`;

        return (
          <div key={poll.id} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', marginBottom: 8, background: 'var(--surface)', cursor: 'pointer' }}
            onClick={() => setExpanded(isExpanded ? null : poll.id)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: 15, margin: 0 }}>{poll.title}</h4>
                {poll.description && <p style={{ fontSize: 13, color: 'var(--text2)', margin: '4px 0' }}>{poll.description}</p>}
                <div style={{ fontSize: 12, color: 'var(--text2)', display: 'flex', gap: 12 }}>
                  <span>{poll.options_count || 0} вариантов</span>
                  <span>{poll.total_votes || 0} голосов</span>
                  {hasVoted && <span style={{ color: 'var(--accent)' }}>✅ Вы проголосовали</span>}
                </div>
              </div>
            </div>

            {isExpanded && (
              <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                {poll.options?.map(opt => {
                  const pct = calcPct(opt.votes_count || opt.votes || 0, poll.total_votes || 1);
                  return (
                    <div key={opt.id} onClick={() => !hasVoted && vote(poll.id, opt.id)}
                      style={{
                        padding: '8px 10px', marginBottom: 4, borderRadius: 6,
                        background: hasVoted ? '#f0f4ff' : 'var(--bg)',
                        cursor: hasVoted ? 'default' : 'pointer',
                        border: opt.id === (poll.my_votes?.[0]) ? '2px solid var(--accent)' : '1px solid transparent',
                        position: 'relative', overflow: 'hidden',
                      }}>
                      {hasVoted && <div style={{
                        position: 'absolute', top: 0, left: 0, height: '100%',
                        width: `${pct}%`, background: 'rgba(43,126,249,0.1)',
                        transition: 'width 0.3s',
                      }} />}
                      <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                        <span>{opt.text}</span>
                        {hasVoted && <span style={{ fontWeight: 600 }}>{opt.votes_count || opt.votes || 0} ({pct}%)</span>}
                      </div>
                    </div>
                  );
                }) || <div style={{ fontSize: 13, color: 'var(--text2)' }}>Нет вариантов</div>}
              </div>
            )}
          </div>
        );
      })}
    </Layout>
  );
}
