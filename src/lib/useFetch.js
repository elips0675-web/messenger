import { useState, useEffect, useCallback } from 'react';
import { api } from './api';

export default function useFetch(url, { params, fallback, immediate = true } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!url) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const result = await api.get(url, { params });
      setData(result);
      return result;
    } catch (err) {
      setError(err);
      if (fallback) {
        try {
          const saved = JSON.parse(localStorage.getItem(fallback));
          if (saved) setData(saved);
        } catch {}
      }
    } finally {
      setLoading(false);
    }
  }, [url, params && JSON.stringify(params)]);

  useEffect(() => {
    if (immediate) fetchData();
  }, [fetchData, immediate]);

  return { data, loading, error, refetch: fetchData, setData };
}
