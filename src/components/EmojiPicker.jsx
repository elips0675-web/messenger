import { useState, useEffect, useRef } from 'react';

const DEFAULT_EMOJI = ['👍','❤️','😄','😢','😡','🔥','👀','🎉','🚀','👏','💪','🤝','✅','❌','⭐','🙏'];

function loadCustom() {
  try { return JSON.parse(localStorage.getItem('custom_emoji') || '[]'); } catch { return []; }
}
function saveCustom(list) {
  localStorage.setItem('custom_emoji', JSON.stringify(list));
}

export default function EmojiPicker({ onSelect, onClose }) {
  const [tab, setTab] = useState('emoji');
  const [custom, setCustom] = useState(loadCustom);
  const [uploading, setUploading] = useState(false);
  const [gifQuery, setGifQuery] = useState('');
  const [gifs, setGifs] = useState([]);
  const [gifLoading, setGifLoading] = useState(false);
  const fileRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => { saveCustom(custom); }, [custom]);

  useEffect(() => {
    if (!gifQuery.trim()) { setGifs([]); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setGifLoading(true);
      try {
        const key = localStorage.getItem('giphy_api_key') || 'hbVQTNdRl47xNTFejuT9dmaEF0RmeSZY';
        const resp = await fetch(
          `https://api.giphy.com/v1/gifs/search?api_key=${key}&q=${encodeURIComponent(gifQuery)}&limit=20&rating=g`
        );
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        const data = await resp.json();
        setGifs(data.data || []);
      } catch {
        setGifs([]);
      }
      setGifLoading(false);
    }, 400);
  }, [gifQuery]);

  const handleUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const name = file.name.replace(/\.[^.]+$/, '').toLowerCase().slice(0, 20);
      setCustom(prev => [...prev, { name, url: ev.target.result }]);
      setUploading(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="emoji-picker" onClick={e => e.stopPropagation()}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          <button className={`btn-tab ${tab === 'emoji' ? 'active' : ''}`} onClick={() => setTab('emoji')}>😊</button>
          <button className={`btn-tab ${tab === 'gif' ? 'active' : ''}`} onClick={() => setTab('gif')}>GIF</button>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--text2)' }}>✕</button>
      </div>

      {tab === 'emoji' && (
        <>
          <div className="emoji-grid">
            {DEFAULT_EMOJI.map(e => (
              <span key={e} className="emoji-item" onClick={() => onSelect(e)}>{e}</span>
            ))}
          </div>

          {custom.length > 0 && (
            <>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 8, marginBottom: 4 }}>Свои эмодзи</div>
              <div className="emoji-grid">
                {custom.map((e, i) => (
                  <span key={i} className="emoji-item" onClick={() => onSelect(e.url)} title={e.name}>
                    {e.url.startsWith('data:') ? <img src={e.url} alt={e.name} style={{ width: 22, height: 22, borderRadius: 4 }} /> : e.url}
                  </span>
                ))}
              </div>
            </>
          )}

          <div style={{ marginTop: 8 }}>
            <button className="btn-sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? 'Загрузка...' : '➕ Загрузить emoji'}
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUpload} />
          </div>
        </>
      )}

      {tab === 'gif' && (
        <div style={{ width: 280 }}>
            <div style={{ position: 'relative' }}>
              <input
                value={gifQuery}
                onChange={e => setGifQuery(e.target.value)}
                placeholder="Поиск GIF..."
                style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
              />
              <span style={{ position: 'absolute', right: 8, top: 8, fontSize: 10, color: 'var(--text2)' }}>GIPHY</span>
            </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 4, marginTop: 8, maxHeight: 300, overflowY: 'auto' }}>
            {gifLoading && <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--text2)', fontSize: 12 }}>Загрузка...</div>}
            {!gifLoading && gifs.length === 0 && gifQuery.trim() && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--text2)', fontSize: 12 }}>Ничего не найдено</div>
            )}
              {gifs.map(gif => (
                <img
                  key={gif.id}
                  src={gif.images?.fixed_width_downsampled?.url || gif.images?.original?.url}
                  alt=""
                  style={{ width: '100%', borderRadius: 8, cursor: 'pointer', aspectRatio: '1/1', objectFit: 'cover' }}
                  onClick={() => {
                    onSelect(gif.images?.original?.url || gif.images?.fixed_width?.url);
                    onClose?.();
                  }}
                />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}