import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { api } from '../lib/api';
import { useToast } from '../components/Toast';

export default function Feed() {
  const addToast = useToast();
  const [posts, setPosts] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [comments, setComments] = useState({});
  const [commentText, setCommentText] = useState({});
  const [showComments, setShowComments] = useState({});
  const me = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    api.get('/feed').then(data => { setPosts(data); setLoading(false); }).catch(() => {
      try { const d = JSON.parse(localStorage.getItem('feed_posts')); if (d) setPosts(d); } catch {}
      setLoading(false);
    });
  }, []);

  const createPost = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      const post = await api.post('/feed', { text: text.trim() });
      setPosts(prev => [{ ...post, liked_by_me: 0, likes_count: 0, comments_count: 0 }, ...prev]);
      setText('');
    } catch (err) {
      const fallback = { id: Date.now(), user_id: me.id, user_name: me.name, user_avatar: me.avatar, text: text.trim(), likes_count: 0, comments_count: 0, liked_by_me: 0, created_at: new Date().toISOString() };
      setPosts(prev => [fallback, ...prev]);
      const saved = JSON.parse(localStorage.getItem('feed_posts') || '[]');
      localStorage.setItem('feed_posts', JSON.stringify([fallback, ...saved]));
      setText('');
    } finally { setSending(false); }
  };

  const toggleLike = async (postId) => {
    try {
      const res = await api.post(`/feed/${postId}/like`);
      setPosts(prev => prev.map(p => p.id === postId ? {
        ...p, liked_by_me: res.liked ? 1 : 0, likes_count: p.likes_count + (res.liked ? 1 : -1)
      } : p));
    } catch { addToast('Ошибка при лайке', 'error'); }
  };

  const deletePost = async (postId) => {
    try {
      await api.delete(`/feed/${postId}`);
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch { addToast('Ошибка при удалении', 'error'); }
  };

  const loadComments = async (postId) => {
    try {
      const data = await api.get(`/feed/${postId}/comments`);
      setComments(prev => ({ ...prev, [postId]: data }));
    } catch { addToast('Ошибка загрузки комментариев', 'error'); }
  };

  const addComment = async (postId) => {
    const t = commentText[postId];
    if (!t?.trim()) return;
    try {
      const comment = await api.post(`/feed/${postId}/comments`, { text: t.trim() });
      setComments(prev => ({ ...prev, [postId]: [...(prev[postId] || []), comment] }));
      setCommentText(prev => ({ ...prev, [postId]: '' }));
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p));
    } catch { addToast('Ошибка при добавлении комментария', 'error'); }
  };

  const COLORS = ['#2b7ef9', '#f59e0b', '#22c55e', '#ef4444', '#8b5cf6', '#ec4899'];
  const avatarColor = (name) => COLORS[(name?.charCodeAt(0) || 0) % COLORS.length];
  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return 'только что';
    if (min < 60) return `${min}м назад`;
    const h = Math.floor(min / 60);
    if (h < 24) return `${h}ч назад`;
    const d = Math.floor(h / 24);
    return `${d}д назад`;
  };

  return (
    <Layout title="Новости">
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'flex-start' }}>
        <div className="user-avatar" style={{ background: avatarColor(me.name), width: 40, height: 40, fontSize: 16, flexShrink: 0 }}>
          {me.name?.[0] || '?'}
        </div>
        <div style={{ flex: 1 }}>
          <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Что у вас нового?" rows={2}
            style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 12, outline: 'none', fontSize: 14, resize: 'none', background: 'var(--bg)', boxSizing: 'border-box', fontFamily: 'inherit' }} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <button className="btn-primary" onClick={createPost} disabled={sending || !text.trim()} style={{ opacity: sending || !text.trim() ? .5 : 1 }}>
              {sending ? 'Публикация...' : 'Опубликовать'}
            </button>
          </div>
        </div>
      </div>

      {loading ? <div style={{ padding: 40, textAlign: 'center', color: 'var(--text2)' }}>Загрузка...</div> : posts.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">📰</div><p>Новостей пока нет. Напишите первый пост!</p></div>
      ) : posts.map(post => (
        <div key={post.id} className="post-card" style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 12, background: 'var(--surface)' }}>
          <div className="post-header" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div className="user-avatar" style={{ background: avatarColor(post.user_name), width: 36, height: 36, fontSize: 14 }}>
              {post.user_name?.[0] || '?'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{post.user_name}</div>
              <div style={{ fontSize: 11, color: 'var(--text2)' }}>{timeAgo(post.created_at)}</div>
            </div>
            {post.user_id === me.id && (
              <button className="btn-sm" style={{ color: 'var(--red)', fontSize: 12, padding: '4px 8px' }} onClick={() => deletePost(post.id)}>🗑️</button>
            )}
          </div>
          <div className="post-body" style={{ fontSize: 14, lineHeight: 1.5, marginBottom: 10, whiteSpace: 'pre-wrap' }}>{post.text}</div>
          {post.image_url && <img src={post.image_url} style={{ maxWidth: '100%', borderRadius: 8, marginBottom: 10 }} />}
          <div className="post-actions" style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
            <button className={`btn-sm ${post.liked_by_me ? 'liked' : ''}`} onClick={() => toggleLike(post.id)}
              style={{ color: post.liked_by_me ? '#2b7ef9' : 'var(--text2)', fontWeight: post.liked_by_me ? 600 : 400 }}>
              {post.liked_by_me ? '👍' : '👍'} {post.likes_count || 0}
            </button>
            <button className="btn-sm" onClick={() => { setShowComments(prev => ({ ...prev, [post.id]: !prev[post.id] })); if (!comments[post.id]) loadComments(post.id); }}
              style={{ color: 'var(--text2)' }}>
              💬 {post.comments_count || 0}
            </button>
          </div>
          {showComments[post.id] && (
            <div className="post-comments" style={{ marginTop: 10, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
              {(comments[post.id] || []).map(c => (
                <div key={c.id} style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: 13 }}>
                  <div className="user-avatar" style={{ background: avatarColor(c.user_name), width: 28, height: 28, fontSize: 11, flexShrink: 0 }}>
                    {c.user_name?.[0] || '?'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: 12 }}>{c.user_name}</strong>
                    <p style={{ margin: '2px 0 0', lineHeight: 1.4 }}>{c.text}</p>
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <input value={commentText[post.id] || ''} onChange={e => setCommentText(prev => ({ ...prev, [post.id]: e.target.value }))}
                  placeholder="Написать комментарий..." style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, outline: 'none', fontSize: 13, background: 'var(--bg)' }} />
                <button className="btn-sm" onClick={() => addComment(post.id)} style={{ whiteSpace: 'nowrap' }}>Отправить</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </Layout>
  );
}
