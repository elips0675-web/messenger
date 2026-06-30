import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../lib/api';

export default function TwoFactorSetup() {
  const navigate = useNavigate();
  const [secret, setSecret] = useState('');
  const [qrUrl, setQrUrl] = useState('');
  const [code, setCode] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/auth/2fa/status').then(d => setEnabled(d.enabled)).catch(() => {});
  }, []);

  const handleSetup = async () => {
    setLoading(true);
    try {
      const data = await api.post('/auth/2fa/setup');
      setSecret(data.secret);
      setQrUrl(data.qrUrl);
    } catch (e) {
      setError(e.message || 'Ошибка настройки');
    } finally { setLoading(false); }
  };

  const handleVerify = async () => {
    if (!code) return;
    setLoading(true);
    try {
      await api.post('/auth/2fa/verify', { code, secret });
      setEnabled(true);
      setSecret('');
      setQrUrl('');
      setCode('');
    } catch (e) {
      setError(e.message || 'Неверный код');
    } finally { setLoading(false); }
  };

  const handleDisable = async () => {
    setLoading(true);
    try {
      await api.post('/auth/2fa/disable', { code });
      setEnabled(false);
    } catch (e) {
      setError(e.message || 'Ошибка отключения');
    } finally { setLoading(false); }
  };

  return (
    <Layout title="Двухфакторная аутентификация">
      <div style={{ maxWidth: 540, margin: '0 auto' }}>
        {error && (
          <div style={{ padding: '10px 14px', background: '#fef2f2', borderRadius: 10, marginBottom: 16, fontSize: 13, color: 'var(--red)' }}>
            {error}
          </div>
        )}

        {enabled ? (
          <div className="card" style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <h3>2FA включена</h3>
            <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 20 }}>
              При входе в систему потребуется код из приложения-аутентификатора
            </p>
            <div className="form-group">
              <label>Введите код для отключения</label>
              <input type="text" value={code} onChange={e => setCode(e.target.value)} placeholder="000000" maxLength={6} />
            </div>
            <button className="btn-primary" style={{ background: 'var(--red)' }} onClick={handleDisable} disabled={loading || !code}>
              Отключить 2FA
            </button>
          </div>
        ) : qrUrl ? (
          <div className="card" style={{ textAlign: 'center', padding: 40 }}>
            <h3>Настройка 2FA</h3>
            <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 16 }}>
              Отсканируйте QR-код в приложении (Google Authenticator, Authy)
            </p>
            <img src={qrUrl} alt="TOTP QR" style={{ width: 200, height: 200, margin: '0 auto 20px', borderRadius: 12, border: '1px solid var(--border)' }} />
            <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 12 }}>Или введите ключ вручную: <strong>{secret}</strong></p>
            <div className="form-group">
              <label>Код из приложения</label>
              <input type="text" value={code} onChange={e => setCode(e.target.value)} placeholder="000000" maxLength={6} />
            </div>
            <button className="btn-primary" onClick={handleVerify} disabled={loading || code.length < 6}>
              Подтвердить
            </button>
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔐</div>
            <h3>Двухфакторная аутентификация</h3>
            <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 24 }}>
              Защитите свой аккаунт с помощью TOTP. После включения при входе потребуется код из приложения-аутентификатора.
            </p>
            <button className="btn-primary" onClick={handleSetup} disabled={loading}>
              Настроить 2FA
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
