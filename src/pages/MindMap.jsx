import { useState, useRef, useCallback, useEffect } from 'react';
import Layout from '../components/Layout';
import { api } from '../lib/api';

const COLORS = ['#6c5ce7', '#fd79a8', '#00b894', '#fdcb6e', '#0984e3', '#e17055', '#00cec9', '#636e72'];

export default function MindMap() {
  const [maps, setMaps] = useState([]);
  const [currentId, setCurrentId] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const [mapName, setMapName] = useState('Новая карта');
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);
  const [drag, setDrag] = useState(null);
  const [linkMode, setLinkMode] = useState(false);
  const [linkFrom, setLinkFrom] = useState(null);
  const [zoom, setZoom] = useState(1);
  const canvasRef = useRef(null);
  const loadingRef = useRef(false);

  const loadMaps = () => {
    api.get('/mindmap').then(data => {
      setMaps(data);
      if (!currentId && data.length) loadMap(data[0].id);
    }).catch(() => {});
  };

  useEffect(() => { loadMaps(); }, []);

  const loadMap = (id) => {
    loadingRef.current = true;
    api.get(`/mindmap/${id}`).then(data => {
      setCurrentId(data.id);
      setNodes(Array.isArray(data.nodes) ? data.nodes : []);
      setLinks(Array.isArray(data.links) ? data.links : []);
      setMapName(data.name || 'Новая карта');
      setSelected(null);
      loadingRef.current = false;
    }).catch(() => {
      loadingRef.current = false;
      try {
        const d = JSON.parse(localStorage.getItem('mindmap_' + id));
        if (d) { setNodes(d.nodes || []); setLinks(d.links || []); }
      } catch {}
    });
  };

  const saveToApi = useCallback((n, l) => {
    if (!currentId) return;
    localStorage.setItem('mindmap_' + currentId, JSON.stringify({ nodes: n, links: l }));
    try { api.put(`/mindmap/${currentId}`, { nodes: n, links: l }); } catch {}
  }, [currentId]);

  const save = useCallback((n, l) => {
    setNodes(n); setLinks(l);
    saveToApi(n, l);
  }, [saveToApi]);

  const handleMouseDown = useCallback((e, nodeId) => {
    if (linkMode) {
      if (linkFrom && linkFrom !== nodeId) { setLinks(prev => [...prev, { from: linkFrom, to: nodeId }]); setLinkMode(false); setLinkFrom(null); }
      else setLinkFrom(nodeId);
      return;
    }
    setSelected(nodeId);
    const n = nodes.find(no => no.id === nodeId);
    setDrag({ id: nodeId, ox: e.clientX, oy: e.clientY, nx: n.x, ny: n.y });
  }, [linkMode, linkFrom, nodes]);

  const handleMouseMove = useCallback((e) => {
    if (!drag) return;
    setNodes(prev => prev.map(n => n.id === drag.id ? { ...n, x: drag.nx + e.clientX - drag.ox, y: drag.ny + e.clientY - drag.oy } : n));
  }, [drag]);

  const handleMouseUp = useCallback(() => { setDrag(null); }, []);

  const handleDoubleClick = useCallback((e) => {
    if (e.target !== canvasRef.current) return;
    const r = canvasRef.current.getBoundingClientRect();
    const id = 'n' + Date.now();
    setNodes(prev => [...prev, { id, x: (e.clientX - r.left) / zoom - 60, y: (e.clientY - r.top) / zoom - 20, text: 'Новая идея', color: COLORS[nodes.length % COLORS.length] }]);
    setSelected(id); setEditing(id);
  }, [zoom, nodes.length]);

  const deleteNode = useCallback((id) => {
    setNodes(prev => { const n = prev.filter(no => no.id !== id); save(n, links.filter(l => l.from !== id && l.to !== id)); return n; });
    setLinks(prev => prev.filter(l => l.from !== id && l.to !== id));
    if (selected === id) setSelected(null);
  }, [selected, links, save]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Delete' && selected) deleteNode(selected);
    if (e.key === 'Escape') { setSelected(null); setEditing(null); setLinkMode(false); setLinkFrom(null); }
  }, [selected, deleteNode]);

  useEffect(() => { window.addEventListener('keydown', handleKeyDown); return () => window.removeEventListener('keydown', handleKeyDown); }, [handleKeyDown]);

  const newMap = async () => {
    try {
      const data = await api.post('/mindmap', { name: 'Новая карта', nodes: [], links: [] });
      setMaps(prev => [...prev, { id: data.id, name: 'Новая карта' }]);
      setCurrentId(data.id); setNodes([]); setLinks([]); setMapName('Новая карта');
    } catch {}
  };

  const deleteMap = async () => {
    if (!currentId) return;
    try { await api.delete(`/mindmap/${currentId}`); } catch {}
    setMaps(prev => prev.filter(m => m.id !== currentId));
    const remaining = maps.filter(m => m.id !== currentId);
    if (remaining.length) loadMap(remaining[0].id);
    else { setCurrentId(null); setNodes([]); setLinks([]); }
  };

  const nodeById = (id) => nodes.find(n => n.id === id);

  return (
    <Layout title="Интеллект-карта">
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 0', flexWrap: 'wrap' }}>
          <select value={currentId || ''} onChange={e => loadMap(Number(e.target.value))} className="btn-sm" style={{ fontSize: 12, padding: '4px 8px', maxWidth: 160 }}>
            {maps.length === 0 && <option value="">Нет карт</option>}
            {maps.map(m => <option key={m.id} value={m.id}>{m.name || 'Карта ' + m.id}</option>)}
          </select>
          <button className="btn-sm" onClick={newMap}>➕ Новая</button>
          {currentId && <button className="btn-sm" onClick={deleteMap}>🗑 Удалить</button>}
          <div className="sep" />
          <button className="btn-sm" onClick={() => { const svg = document.querySelector('.mindmap-svg'); if (svg) { const s = new XMLSerializer().serializeToString(svg); const b = new Blob([s], {type:'image/svg+xml'}); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.download='mindmap.svg'; a.href=u; a.click(); URL.revokeObjectURL(u); } }}>💾 SVG</button>
          <div className="sep" />
          <button className="btn-sm" onClick={() => setLinkMode(!linkMode)} style={{ background: linkMode ? 'var(--primary)' : '', color: linkMode ? '#fff' : '' }}>🔗 Связь {linkMode ? '(вкл)' : ''}</button>
          <span style={{ fontSize: 13, color: 'var(--text2)' }}>Масштаб: {Math.round(zoom * 100)}%</span>
          <button className="btn-sm" onClick={() => setZoom(z => Math.min(z + 0.1, 2))}>+</button>
          <button className="btn-sm" onClick={() => setZoom(z => Math.max(z - 0.1, 0.3))}>−</button>
          <input value={mapName} onChange={e => setMapName(e.target.value)} onBlur={() => { if (currentId) try { api.put(`/mindmap/${currentId}`, { name: mapName }); } catch {} }}
            style={{ fontSize: 13, border: '1px solid var(--border)', borderRadius: 6, padding: '4px 8px', outline: 'none', maxWidth: 150 }} placeholder="Название карты" />
        </div>
        <div ref={canvasRef} style={{ flex: 1, border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', background: '#fafbfc', position: 'relative', cursor: drag ? 'grabbing' : linkMode ? 'crosshair' : 'default' }}
          onDoubleClick={handleDoubleClick} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
          <svg className="mindmap-svg" width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', transform: `scale(${zoom})`, transformOrigin: '0 0' }}>
            <defs><marker id="a" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#b2bec3" /></marker></defs>
            {links.map((l, i) => {
              const a = nodeById(l.from), b = nodeById(l.to);
              if (!a || !b) return null;
              return <line key={i} x1={a.x + 60} y1={a.y + 20} x2={b.x + 60} y2={b.y + 20} stroke="#b2bec3" strokeWidth={2} markerEnd="url(#a)" />;
            })}
          </svg>
          {nodes.map(n => (
            <div key={n.id} onMouseDown={e => handleMouseDown(e, n.id)}
              style={{ position: 'absolute', left: n.x, top: n.y, width: 120, minHeight: 40, background: n.color, color: '#fff', borderRadius: 12, padding: '8px 14px', cursor: linkMode ? 'crosshair' : drag?.id === n.id ? 'grabbing' : 'grab', boxShadow: selected === n.id ? '0 4px 16px rgba(108,92,231,.35)' : '0 2px 8px rgba(0,0,0,.12)', transform: `scale(${zoom})`, transformOrigin: '0 0', zIndex: selected === n.id ? 10 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontWeight: 600, fontSize: 13, userSelect: 'none' }}
              onClick={() => setSelected(n.id)} onDoubleClick={(e) => { e.stopPropagation(); setEditing(n.id); }}>
              {editing === n.id ? (
                <textarea autoFocus value={n.text} onChange={e => { const t = e.target.value; setNodes(prev => prev.map(p => p.id === n.id ? { ...p, text: t } : p)); }}
                  onBlur={() => setEditing(null)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); setEditing(null); } }}
                  style={{ background: 'rgba(255,255,255,.25)', border: 'none', borderRadius: 6, padding: 4, color: '#fff', textAlign: 'center', fontWeight: 600, fontSize: 13, width: '100%', resize: 'none', outline: 'none' }} />
              ) : n.text}
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
