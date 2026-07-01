export function safeJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch { return fallback; }
}

export function formatDate(date, fmt = 'date') {
  if (!date) return '';
  const d = new Date(date);
  if (fmt === 'date') return d.toLocaleDateString('ru-RU');
  if (fmt === 'datetime') return d.toLocaleString('ru-RU');
  if (fmt === 'time') return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  if (fmt === 'short') return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  return d.toLocaleDateString('ru-RU');
}

export function getToken() {
  try { return localStorage.getItem('messenger_token'); } catch { return null; }
}

export function setToken(token) {
  try { localStorage.setItem('messenger_token', token || ''); } catch {}
}

export function getRefreshToken() {
  try { return localStorage.getItem('messenger_refresh'); } catch { return null; }
}

export function calcPercent(votes, total) {
  return total > 0 ? Math.round(votes / total * 100) : 0;
}

export const AVATAR_COLORS = ['#2b7ef9', '#f59e0b', '#22c55e', '#ef4444', '#8b5cf6', '#ec4899'];

export function avatarColor(name) {
  return AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];
}

export function formatSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / 1048576).toFixed(1)} МБ`;
}
