export function safeJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch { return fallback; }
}

export function isArr(v) { return Array.isArray(v); }
export function isObj(v) { return v && typeof v === 'object' && !Array.isArray(v); }
export function isStr(v) { return typeof v === 'string'; }
export function isNum(v) { return typeof v === 'number' && !Number.isNaN(v); }
