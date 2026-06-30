function getToken() {
  return localStorage.getItem('messenger_token');
}

let pendingRefresh = null;

async function tryRefresh() {
  const refresh = localStorage.getItem('messenger_refresh');
  if (!refresh) throw new Error('No refresh token');
  const res = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refresh }),
  });
  if (!res.ok) {
    localStorage.removeItem('messenger_token');
    localStorage.removeItem('messenger_refresh');
    throw new Error('Refresh failed');
  }
  const data = await res.json();
  localStorage.setItem('messenger_token', data.token);
  localStorage.setItem('messenger_refresh', data.refresh_token);
  return data.token;
}

class ApiClient {
  constructor() {
    this.baseUrl = '/api';
    this.defaultTimeout = 10000;
    this.maxRetries = 3;
  }

  buildUrl(path, params) {
    const url = new URL(`${this.baseUrl}${path}`, window.location.origin);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) url.searchParams.set(key, String(value));
      });
    }
    return url.toString();
  }

  async request(method, path, options = {}) {
    const { body, params, timeout = this.defaultTimeout, retries = this.maxRetries, headers: extraHeaders, ...rest } = options;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const doFetch = async (attemptToken) => {
      const token = attemptToken || getToken();
      const headers = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(extraHeaders || {}),
      };
      const fetchOptions = { method, headers, signal: controller.signal, ...rest };
      if (body) fetchOptions.body = JSON.stringify(body);
      return fetch(this.buildUrl(path, params), fetchOptions);
    };

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        let response = await doFetch();
        if (response.status === 401) {
          if (!pendingRefresh) {
            pendingRefresh = tryRefresh().catch(() => null).finally(() => { pendingRefresh = null; });
          }
          const newToken = await pendingRefresh;
          if (newToken) {
            response = await doFetch(newToken);
          } else {
            window.location.href = '/';
            throw { message: 'Session expired', status: 401 };
          }
        }
        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          throw { message: errorBody.error || errorBody.message || `HTTP ${response.status}`, status: response.status, code: errorBody.code };
        }
        clearTimeout(timeoutId);
        return await response.json();
      } catch (error) {
        clearTimeout(timeoutId);
        const isLastAttempt = attempt === retries;
        if (error.status === 401) throw error;
        if (error instanceof DOMException && error.name === 'AbortError') {
          throw { message: 'Request timed out', status: 408 };
        }
        if (!isLastAttempt) {
          await new Promise((resolve) => setTimeout(resolve, Math.min(1000 * 2 ** attempt, 5000)));
          continue;
        }
        throw error;
      }
    }
    throw { message: 'Unexpected error', status: 500 };
  }

  get(path, options) { return this.request('GET', path, options); }
  post(path, body, options) { return this.request('POST', path, { ...options, body }); }
  put(path, body, options) { return this.request('PUT', path, { ...options, body }); }
  patch(path, body, options) { return this.request('PATCH', path, { ...options, body }); }
  delete(path, options) { return this.request('DELETE', path, options); }
}

export const api = new ApiClient();
