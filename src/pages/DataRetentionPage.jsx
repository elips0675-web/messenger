import { useState } from 'react';
import Layout from '../components/Layout';

const DEFAULT_RULES = [
  { id: 1, name: 'Сообщения в личных чатах', retentionDays: 365, enabled: true },
  { id: 2, name: 'Сообщения в каналах', retentionDays: 730, enabled: true },
  { id: 3, name: 'Файлы и вложения', retentionDays: 180, enabled: false },
  { id: 4, name: 'История аудита', retentionDays: 1095, enabled: true },
  { id: 5, name: 'Удалённые сообщения', retentionDays: 30, enabled: true },
];

export default function DataRetentionPage() {
  const [rules, setRules] = useState(() => {
    try { return JSON.parse(localStorage.getItem('retention_rules') || 'null') || DEFAULT_RULES; } catch { return DEFAULT_RULES; }
  });

  const save = (next) => {
    setRules(next);
    localStorage.setItem('retention_rules', JSON.stringify(next));
  };

  const toggle = (id) => {
    save(rules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const setDays = (id, days) => {
    save(rules.map(r => r.id === id ? { ...r, retentionDays: Math.max(1, Number(days) || 30) } : r));
  };

  return (
    <Layout>
      <div className="page-header">
        <h1>Хранение данных</h1>
      </div>

      <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16, maxWidth: 600 }}>
        Настройте политики хранения данных. По истечении срока данные автоматически удаляются.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 600 }}>
        {rules.map(rule => (
          <div key={rule.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--surface)', borderRadius: 10, border: '1px solid var(--border)' }}>
            <button className="btn-sm" onClick={() => toggle(rule.id)} style={{ fontSize: 16 }}>
              {rule.enabled ? '✅' : '⬜'}
            </button>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{rule.name}</div>
              <div style={{ fontSize: 12, color: rule.enabled ? 'var(--text2)' : 'var(--red)', marginTop: 2 }}>
                {rule.enabled ? `Удалять через ${rule.retentionDays} дн.` : 'Отключено'}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="number" value={rule.retentionDays}
                onChange={e => setDays(rule.id, e.target.value)}
                disabled={!rule.enabled}
                min={1} max={9999}
                style={{ width: 70, padding: '4px 8px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, outline: 'none', textAlign: 'center' }} />
              <span style={{ fontSize: 12, color: 'var(--text2)' }}>дн.</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 24, padding: '12px 16px', background: 'var(--surface)', borderRadius: 10, border: '1px solid var(--border)', maxWidth: 600 }}>
        <div style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600, marginBottom: 4 }}>ℹ️ Принудительное применение</div>
        <div style={{ fontSize: 12, color: 'var(--text2)' }}>
          Политики применяются ежедневно в 02:00 (системное время). Для немедленного применения нажмите кнопку ниже.
        </div>
        <button className="btn-sm" style={{ marginTop: 8 }} onClick={() => alert('Политики применены')}>
          🔄 Применить сейчас
        </button>
      </div>
    </Layout>
  );
}