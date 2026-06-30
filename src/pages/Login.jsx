import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../lib/api';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('messenger_token')) navigate('/chats', { replace: true });
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true); setError('');
    try {
      const data = await api.post('/auth/login', { email, password });
      localStorage.setItem('messenger_token', data.token);
      localStorage.setItem('messenger_refresh', data.refresh_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/chats', { replace: true });
    } catch (err) {
      setError(err.message || 'Ошибка входа');
    } finally { setLoading(false); }
  };

  const quickLogin = async (id) => {
    const emails = ['ceo@company.ru', 'it@company.ru', 'dev1@company.ru', 'buh@company.ru', 'hr@company.ru', 'dev2@company.ru'];
    setEmail(emails[id - 1]); setPassword('password123');
    try {
      const data = await api.post('/auth/login', { email: emails[id - 1], password: 'password123' });
      localStorage.setItem('messenger_token', data.token);
      localStorage.setItem('messenger_refresh', data.refresh_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/chats', { replace: true });
    } catch (err) { setError(err.message); }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">💼</div>
        <h1>Corp Messenger</h1>
        <p style={{ color: 'var(--text2)', marginBottom: 20 }}>Войдите в корпоративный портал</p>
        <form onSubmit={handleLogin}>
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
            style={{ width: '100%', padding: '12px 14px', border: '1px solid var(--border)', borderRadius: 10, fontSize: 14, outline: 'none', marginBottom: 10, boxSizing: 'border-box' }} />
          <input type="password" placeholder="Пароль" value={password} onChange={e => setPassword(e.target.value)}
            style={{ width: '100%', padding: '12px 14px', border: '1px solid var(--border)', borderRadius: 10, fontSize: 14, outline: 'none', marginBottom: 10, boxSizing: 'border-box' }} />
          {error && <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 8 }}>{error}</div>}
          <button className="send-btn" type="submit" style={{ width: '100%', padding: 12, fontSize: 15 }} disabled={loading}>
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
        <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8 }}>Быстрый вход (пароль: password123):</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
            {[1,2,3,4,5,6].map(id => (
              <button key={id} className="btn-sm" onClick={() => quickLogin(id)}
                style={{ fontSize: 11, padding: '4px 10px' }}>👤 {id}</button>
            ))}
          </div>
        </div>
        <div style={{ marginTop: 12, textAlign: 'center', fontSize: 12, color: 'var(--text2)' }}>
          Нет аккаунта? <a href="/register" style={{ color: 'var(--primary)' }}>Регистрация</a>
        </div>
      </div>
    </div>
  );
}
