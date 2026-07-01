import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../lib/api';
import { useToast } from '../components/Toast';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';

export default function CourseDetail() {
  const { id } = useParams();
  const addToast = useToast();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [quiz, setQuiz] = useState([]);
  const [progress, setProgress] = useState(null);
  const [tab, setTab] = useState('lessons');
  const [currentLesson, setCurrentLesson] = useState(null);
  const [newLesson, setNewLesson] = useState({ title: '', content: '' });
  const [showNewLesson, setShowNewLesson] = useState(false);
  const [newQuiz, setNewQuiz] = useState({ question: '', options: ['', '', '', ''], correct_index: 0 });
  const [showNewQuiz, setShowNewQuiz] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/courses/${id}`),
      api.get(`/courses/${id}/lessons`),
      api.get(`/courses/${id}/quiz`),
      api.get(`/courses/${id}/progress`),
    ]).then(([c, l, q, p]) => {
      if (c) setCourse(c);
      if (l) setLessons(l);
      if (q) setQuiz(q);
      if (p) setProgress(p);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  const enroll = async () => {
    try {
      const p = await api.post(`/courses/${id}/enroll`);
      if (p) setProgress(p);
      addToast('Вы записаны', 'success');
    } catch { addToast('Ошибка', 'error'); }
  };

  const completeLesson = async (lessonId) => {
    try {
      const p = await api.post(`/courses/${id}/lessons/${lessonId}/complete`);
      if (p) setProgress(p);
      setCurrentLesson(null);
      addToast('Урок пройден', 'success');
    } catch { addToast('Ошибка', 'error'); }
  };

  const addLesson = async () => {
    if (!newLesson.title.trim()) return;
    try {
      const l = await api.post(`/courses/${id}/lessons`, newLesson);
      setLessons(prev => [...prev, l]);
      setShowNewLesson(false);
      setNewLesson({ title: '', content: '' });
      addToast('Урок добавлен', 'success');
    } catch { addToast('Ошибка', 'error'); }
  };

  const addQuizQuestion = async () => {
    if (!newQuiz.question.trim() || newQuiz.options.some(o => !o.trim())) return;
    try {
      const q = await api.post(`/courses/${id}/quiz`, {
        question: newQuiz.question,
        options: newQuiz.options,
        correct_index: newQuiz.correct_index,
      });
      setQuiz(prev => [...prev, q]);
      setShowNewQuiz(false);
      setNewQuiz({ question: '', options: ['', '', '', ''], correct_index: 0 });
      addToast('Вопрос добавлен', 'success');
    } catch { addToast('Ошибка', 'error'); }
  };

  const answerQuestion = async (questionId, answerIndex) => {
    try {
      const res = await api.post(`/courses/${id}/quiz/answer`, { question_id: questionId, answer_index: answerIndex });
      setQuiz(prev => prev.map(q => q.id === questionId ? { ...q, user_answer: answerIndex, user_correct: res.correct, correct_index: res.correct_index } : q));
      if (res.correct) addToast('✅ Верно!', 'success');
      else addToast('❌ Неверно', 'error');
    } catch (e) { addToast(e.message || 'Ошибка', 'error'); }
  };

  if (loading) return <Layout title="Загрузка..."><Loading /></Layout>;
  if (!course) return <Layout title="Не найдено"><EmptyState icon="❌" message="Не найдено" /></Layout>;

  return (
    <Layout title={`${course.cover || '📚'} ${course.title}`} showBack onBack={() => navigate('/courses')}>
      <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>{course.description}</p>

      {!progress && <button className="btn-primary" style={{ marginBottom: 16 }} onClick={enroll}>📝 Записаться</button>}
      {progress && (
        <div style={{ marginBottom: 16, fontSize: 13, color: 'var(--text2)' }}>
          Прогресс: {progress.completed_lessons}/{progress.total_lessons} уроков • {progress.quiz_score} прав. ответов
          {progress.completed ? ' ✅ Завершён' : ''}
        </div>
      )}

      <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid var(--border)' }}>
        {['lessons', 'quiz'].map(t => (
          <div key={t} className={`tab ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
            style={{ padding: '8px 16px', cursor: 'pointer', borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent', color: tab === t ? 'var(--accent)' : 'var(--text2)', fontWeight: tab === t ? 600 : 400 }}>
            {t === 'lessons' ? '📖 Уроки' : '❓ Тест'}
          </div>
        ))}
      </div>

      {tab === 'lessons' && (
        <>
          <button className="btn-sm" style={{ marginBottom: 12 }} onClick={() => setShowNewLesson(!showNewLesson)}>➕ Урок</button>

          {showNewLesson && (
            <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 16, background: 'var(--surface)' }}>
              <h5 style={{ marginBottom: 8 }}>Новый урок</h5>
              <div className="form-group"><label>Название</label><input value={newLesson.title} onChange={e => setNewLesson({...newLesson, title: e.target.value})} autoFocus /></div>
              <div className="form-group"><label>Содержание</label>
                <textarea value={newLesson.content} onChange={e => setNewLesson({...newLesson, content: e.target.value})} rows={6}
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)', outline: 'none', fontSize: 13, fontFamily: 'monospace', resize: 'vertical', background: 'var(--bg)', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-primary" onClick={addLesson}>Добавить</button>
                <button className="btn-sm" onClick={() => setShowNewLesson(false)}>Отмена</button>
              </div>
            </div>
          )}

          {currentLesson ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h4 style={{ margin: 0 }}>{currentLesson.title}</h4>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn-sm" onClick={() => setCurrentLesson(null)}>Назад</button>
                  {progress && <button className="btn-primary" onClick={() => completeLesson(currentLesson.id)}>✅ Отметить пройденным</button>}
                </div>
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap', background: 'var(--surface)', borderRadius: 8, padding: 16 }}>{currentLesson.content}</div>
            </div>
          ) : (
            lessons.length === 0 ? (
              <EmptyState icon="📖" message="Уроков пока нет" />
            ) : lessons.map((l, i) => (
              <div key={l.id} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', marginBottom: 6, cursor: 'pointer', background: 'var(--surface)' }}
                onClick={() => setCurrentLesson(l)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div><span style={{ fontWeight: 600, fontSize: 13 }}>#{i + 1}</span> {l.title}</div>
                  <span style={{ fontSize: 11, color: 'var(--text2)' }}>➡️</span>
                </div>
              </div>
            ))
          )}
        </>
      )}

      {tab === 'quiz' && (
        <>
          <button className="btn-sm" style={{ marginBottom: 12 }} onClick={() => setShowNewQuiz(!showNewQuiz)}>➕ Вопрос</button>

          {showNewQuiz && (
            <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 16, background: 'var(--surface)' }}>
              <h5 style={{ marginBottom: 8 }}>Новый вопрос</h5>
              <div className="form-group"><label>Вопрос</label><input value={newQuiz.question} onChange={e => setNewQuiz({...newQuiz, question: e.target.value})} autoFocus /></div>
              {newQuiz.options.map((opt, i) => (
                <div key={i} className="form-group"><label>Вариант {i + 1}</label>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input value={opt} onChange={e => { const o = [...newQuiz.options]; o[i] = e.target.value; setNewQuiz({...newQuiz, options: o}); }} style={{ flex: 1 }} />
                    <input type="radio" name="correct" checked={newQuiz.correct_index === i} onChange={() => setNewQuiz({...newQuiz, correct_index: i})} />
                  </div>
                </div>
              ))}
              <div style={{ fontSize: 11, color: 'var(--text2)' }}>Радио-кнопка = правильный ответ</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button className="btn-primary" onClick={addQuizQuestion}>Добавить</button>
                <button className="btn-sm" onClick={() => setShowNewQuiz(false)}>Отмена</button>
              </div>
            </div>
          )}

          {quiz.length === 0 ? (
            <EmptyState icon="❓" message="Вопросов пока нет" />
          ) : quiz.map(q => (
            <div key={q.id} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 14, marginBottom: 10, background: 'var(--surface)' }}>
              <h5 style={{ fontSize: 14, marginBottom: 8 }}>{q.question}</h5>
              {(q.options || []).map((opt, i) => {
                const isSelected = q.user_answer === i;
                const isCorrect = q.user_answer != null && q.correct_index === i;
                const isWrong = q.user_answer === i && !q.user_correct;
                return (
                  <div key={i} style={{
                    padding: '6px 10px', marginBottom: 4, borderRadius: 6, cursor: q.user_answer == null ? 'pointer' : 'default', fontSize: 13,
                    background: isCorrect ? '#dcfce7' : isWrong ? '#fee2e2' : 'var(--bg)',
                    border: isSelected ? '2px solid ' + (isCorrect ? '#22c55e' : '#ef4444') : '2px solid transparent',
                  }} onClick={() => q.user_answer == null && progress && answerQuestion(q.id, i)}>
                    {String.fromCharCode(65 + i)}. {opt}
                  </div>
                );
              })}
              {q.user_answer != null && (
                <div style={{ fontSize: 12, marginTop: 6, color: q.user_correct ? '#166534' : '#991b1b' }}>
                  {q.user_correct ? '✅ Верно' : `❌ Неверно. Правильный: ${String.fromCharCode(65 + q.correct_index)}`}
                </div>
              )}
            </div>
          ))}
        </>
      )}
    </Layout>
  );
}
