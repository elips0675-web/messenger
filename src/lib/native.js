export function isNative() {
  try {
    return typeof window !== 'undefined' && window.Capacitor?.isNativePlatform() === true;
  } catch {
    return false;
  }
}

export function getApiBase() {
  return import.meta.env.VITE_API_URL || 'http://localhost:3001';
}

export function getWsUrl() {
  return import.meta.env.VITE_WS_URL || 'ws://localhost:3001';
}

if (isNative()) {
  const base = getApiBase();
  const origFetch = window.fetch;
  window.fetch = function (input, init) {
    if (typeof input === 'string' && input.startsWith('/api/')) {
      input = `${base}${input}`;
    } else if (input instanceof Request && input.url.startsWith('/api/')) {
      const url = `${base}${input.url}`;
      input = new Request(url, init || {});
    }
    return origFetch.call(window, input, init);
  };
  console.log(`[Native] Capacitor detected, API → ${base}, WS → ${getWsUrl()}`);
}
