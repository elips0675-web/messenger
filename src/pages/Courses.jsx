import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../lib/api';
import { useToast } from '../components/Toast';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';
import useFetch from '../lib/useFetch';

export default function Courses() {
  const addToast = useToast();
  const navigate = useNavigate();
  const { data: courses, loading, setData: setCourses } = useFetch('/courses');
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', cover: '📚' });

  const createCourse = async () => {
    if (!form.title.trim()) return;
    try {
      const c = await api.post('/courses', form);
      setCourses(prev => [c, ...prev]);
      setShowNew(false);
      setForm({ title: '', description: '', cover: '📚' });
      addToast('Курс создан', 'success');
    } catch { addToast('Ошибка', 'error'); }
  };

  const enroll = async (id) => {
    try {
      await api.post(`/courses/${id}/enroll`);
      loadCourses();
      addToast('Вы записаны на курс', 'success');
    } catch { addToast('Ошибка', 'error'); }
  };

  return (
    <Layout title="Обучение">
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button className="btn-primary" onClick={() => setShowNew(!showNew)}>➕ Курс</button>
      </div>

      {showNew && (
        <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 16, background: 'var(--surface)' }}>
          <h4 style={{ marginBottom: 12 }}>Новый курс</h4>
          <div className="form-group"><label>Название</label><input value={form.title} onChange={e => setForm({...form, title: e.target.value})} autoFocus /></div>
          <div className="form-group"><label>Описание</label><textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} /></div>
          <div className="form-group"><label>Иконка</label><input value={form.cover} onChange={e => setForm({...form, cover: e.target.value})} placeholder="📚" /></div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-primary" onClick={createCourse}>Создать</button>
            <button className="btn-sm" onClick={() => setShowNew(false)}>Отмена</button>
          </div>
        </div>
      )}

      {loading ? <Loading /> : courses.length === 0 ? (
        <EmptyState icon="📚" message="Курсов пока нет" />
      ) : courses.map(c => (
        <div key={c.id} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', marginBottom: 8, background: 'var(--surface)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => navigate(`/courses/${c.id}`)}>
              <h4 style={{ fontSize: 15, margin: 0 }}>{c.cover || '📚'} {c.title}</h4>
              {c.description && <p style={{ fontSize: 13, color: 'var(--text2)', margin: '4px 0' }}>{c.description}</p>}
              <div style={{ fontSize: 12, color: 'var(--text2)', display: 'flex', gap: 12 }}>
                <span>📖 {c.lessons_count || 0} уроков</span>
                <span>❓ {c.questions_count || 0} вопросов</span>
              </div>
              {c.total_lessons > 0 && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ height: 6, background: 'var(--bg)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.round((c.completed_lessons || 0) / c.total_lessons * 100)}%`, background: 'var(--accent)', borderRadius: 3 }} />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>
                    {c.completed_lessons || 0}/{c.total_lessons} • {c.quiz_score || 0} правильных ответов
                    {c.completed ? ' ✅ Завершён' : ''}
                  </div>
                </div>
              )}
            </div>
            {!c.total_lessons && c.total_lessons !== 0 && (
              <button className="btn-sm" onClick={() => enroll(c.id)}>Записаться</button>
            )}
          </div>
        </div>
      ))}
    </Layout>
  );
}
