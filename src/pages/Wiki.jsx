import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { api } from '../lib/api';
import { useToast } from '../components/Toast';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';

export default function Wiki() {
  const addToast = useToast();
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCat, setActiveCat] = useState(null);
  const [search, setSearch] = useState('');
  const [viewArticle, setViewArticle] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', category_id: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/wiki/categories').catch(() => []),
      api.get('/wiki').catch(() => (loadFallback()))
    ]).then(([cats, arts]) => {
      if (cats) setCategories(cats);
      if (arts) { setArticles(arts); setLoading(false); }
    });
  }, []);

  const loadFallback = () => {
    try { const d = JSON.parse(localStorage.getItem('wiki_articles')); if (d) setArticles(d); } catch {}
    setLoading(false);
  };

  const filtered = search
    ? articles.filter(a => a.title?.toLowerCase().includes(search.toLowerCase()))
    : activeCat ? articles.filter(a => a.category_id === activeCat) : articles;

  const loadArticle = async (id) => {
    try {
      const data = await api.get(`/wiki/${id}`);
      setViewArticle(data);
    } catch { addToast('Ошибка загрузки статьи', 'error'); }
  };

  const saveArticle = async () => {
    if (!form.title.trim()) return;
    try {
      if (editing?.id) {
        await api.put(`/wiki/${editing.id}`, form);
        setArticles(prev => prev.map(a => a.id === editing.id ? { ...a, ...form } : a));
        setViewArticle(prev => prev ? { ...prev, ...form } : null);
        addToast('Статья сохранена', 'success');
      } else {
        const data = await api.post('/wiki', form);
        setArticles(prev => [data, ...prev]);
        addToast('Статья создана', 'success');
      }
      setEditing(false); setForm({ title: '', content: '', category_id: '' });
    } catch { addToast('Ошибка сохранения', 'error'); }
  };

  const deleteArticle = async (id) => {
    try {
      await api.delete(`/wiki/${id}`);
      setArticles(prev => prev.filter(a => a.id !== id));
      setViewArticle(null);
      addToast('Статья удалена', 'success');
    } catch { addToast('Ошибка удаления', 'error'); }
  };

  const COLORS = ['#2b7ef9', '#f59e0b', '#22c55e', '#ef4444', '#8b5cf6', '#ec4899'];
  const avColor = (name) => COLORS[(name?.charCodeAt(0) || 0) % COLORS.length];

  if (viewArticle) return (
    <Layout title={viewArticle.title} showBack onBack={() => { setViewArticle(null); setEditing(false); }}>
      {editing ? (
        <div>
          <div className="form-group"><label>Заголовок</label><input value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></div>
          <div className="form-group"><label>Категория</label>
            <select value={form.category_id} onChange={e => setForm({...form, category_id: Number(e.target.value)})}>
              <option value="">Без категории</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Содержание (Markdown)</label>
            <textarea value={form.content} onChange={e => setForm({...form, content: e.target.value})} rows={16}
              style={{ width: '100%', padding: 14, borderRadius: 10, border: '1px solid var(--border)', outline: 'none', fontSize: 14, fontFamily: 'monospace', resize: 'vertical', background: 'var(--bg)', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-primary" onClick={saveArticle}>Сохранить</button>
            <button className="btn-sm" onClick={() => setEditing(false)}>Отмена</button>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ fontSize: 13, color: 'var(--text2)' }}>
              {viewArticle.category_icon} {viewArticle.category_name} • 👁 {viewArticle.views || 0} просм. • {viewArticle.author_name}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-sm" onClick={() => { setForm({ title: viewArticle.title, content: viewArticle.content, category_id: viewArticle.category_id || '' }); setEditing(true); }}>✏️ Редактировать</button>
              <button className="btn-sm" style={{ color: 'var(--red)' }} onClick={() => deleteArticle(viewArticle.id)}>🗑️</button>
            </div>
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{viewArticle.content}</div>
        </div>
      )}
    </Layout>
  );

  return (
    <Layout title="База знаний">
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input className="dir-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Поиск по статьям..." style={{ flex: 1 }} />
        <button className="btn-primary" onClick={() => { setForm({ title: '', content: '', category_id: categories[0]?.id || '' }); setEditing({ id: null }); }}>➕ Статья</button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <div className={`tab ${!activeCat ? 'active' : ''}`} onClick={() => setActiveCat(null)}>📋 Все</div>
        {categories.map(c => (
          <div key={c.id} className={`tab ${activeCat === c.id ? 'active' : ''}`} onClick={() => setActiveCat(c.id)}>
            {c.icon} {c.name}
          </div>
        ))}
      </div>

      {editing && !viewArticle && (
        <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 16, background: 'var(--surface)' }}>
          <h4 style={{ marginBottom: 12 }}>Новая статья</h4>
          <div className="form-group"><label>Заголовок</label><input value={form.title} onChange={e => setForm({...form, title: e.target.value})} autoFocus /></div>
          <div className="form-group"><label>Категория</label>
            <select value={form.category_id} onChange={e => setForm({...form, category_id: Number(e.target.value)})}>
              <option value="">Без категории</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Содержание (Markdown)</label>
            <textarea value={form.content} onChange={e => setForm({...form, content: e.target.value})} rows={10}
              style={{ width: '100%', padding: 14, borderRadius: 10, border: '1px solid var(--border)', outline: 'none', fontSize: 14, fontFamily: 'monospace', resize: 'vertical', background: 'var(--bg)', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-primary" onClick={saveArticle}>Опубликовать</button>
            <button className="btn-sm" onClick={() => setEditing(false)}>Отмена</button>
          </div>
        </div>
      )}

      {loading ? <Loading /> : filtered.length === 0 ? (
        <EmptyState icon="📚" message="Статей пока нет" />
      ) : filtered.map(a => (
        <div key={a.id} className="wiki-card" onClick={() => loadArticle(a.id)}
          style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', marginBottom: 8, cursor: 'pointer', background: 'var(--surface)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <div>
              <h4 style={{ fontSize: 15, margin: 0 }}>{a.title}</h4>
              <p style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>
                {a.category_icon} {a.category_name || 'Без категории'} • 👁 {a.views || 0} • {a.author_name}
              </p>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text2)', whiteSpace: 'nowrap' }}>
              {a.updated_at?.slice(0, 10) || a.created_at?.slice(0, 10)}
            </div>
          </div>
        </div>
      ))}
    </Layout>
  );
}
