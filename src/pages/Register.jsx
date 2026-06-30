import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', dept_id: '', title: '' });
  const [departments, setDepartments] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/auth/departments')
      .then(r => r.json())
      .then(setDepartments)
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Ошибка регистрации');
        return;
      }
      localStorage.setItem('messenger_token', data.token);
      if (data.refresh_token) localStorage.setItem('messenger_refresh', data.refresh_token);
      navigate('/chats');
    } catch {
      setError('Ошибка соединения с сервером');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">💼</div>
        <h1>Регистрация</h1>
        <p className="subtitle">Создайте учётную запись</p>

        {error && (
          <div style={{ padding: '10px 14px', background: '#fef2f2', borderRadius: 10, marginBottom: 16, fontSize: 13, color: 'var(--red)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Имя и фамилия</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Иван Петров" required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="ivan@company.ru" required />
          </div>
          <div className="form-group">
            <label>Пароль</label>
            <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="Минимум 6 символов" minLength={6} required />
          </div>
          <div className="form-group">
            <label>Отдел</label>
            <select value={form.dept_id} onChange={e => setForm({ ...form, dept_id: e.target.value })}>
              <option value="">— выберите отдел —</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Должность</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="Например: Junior Developer" />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>

        <div className="demo-info" style={{ marginTop: 20 }}>
          Уже есть аккаунт? <Link to="/" style={{ color: 'var(--primary)', fontWeight: 600 }}>Войти</Link>
        </div>
      </div>
    </div>
  );
}
