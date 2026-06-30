import { useState, useRef, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import { useWebSocket } from '../hooks/useWebSocket';
import { useBoardSync } from '../hooks/useBoardSync';

const COLORS = ['#000000', '#e74c3c', '#f39c12', '#2ecc71', '#3498db', '#9b59b6', '#1abc9c', '#95a5a6'];
const SIZES = [2, 4, 6, 10, 16];

export default function Board() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [color, setColor] = useState('#000000');
  const [size, setSize] = useState(4);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState('pen');
  const [history, setHistory] = useState([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [boardId, setBoardId] = useState('default');
  const token = localStorage.getItem('messenger_token');
  const { socket } = useWebSocket(token);
  const { onDraw, onClear, emitDraw, emitClear } = useBoardSync(socket, boardId);

  const ctxRef = useRef(null);
  const saveRef = useRef({ history, historyIdx });

  useEffect(() => { saveRef.current = { history, historyIdx }; }, [history, historyIdx]);

  const saveState = useCallback((ctx) => {
    if (!ctx) return;
    const { history: h, historyIdx: idx } = saveRef.current;
    const data = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    const newHistory = [...h.slice(0, idx + 1), data];
    setHistory(newHistory);
    setHistoryIdx(newHistory.length - 1);
  }, []);

  const loadState = useCallback((imgData) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.putImageData(imgData, 0, 0);
    saveState(ctx);
  }, [saveState]);

  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    canvas.width = rect.width - 4;
    canvas.height = rect.height - 4;
    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctxRef.current = ctx;
    saveState(ctx);
  }, [saveState]);

  useEffect(() => { setupCanvas(); }, [setupCanvas]);

  useEffect(() => {
    const onResize = () => setupCanvas();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [setupCanvas]);

  useEffect(() => {
    return onDraw((data) => {
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) return;
      ctx.strokeStyle = data.color || '#000';
      ctx.lineWidth = data.size || 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(data.fromX, data.fromY);
      ctx.lineTo(data.toX, data.toY);
      ctx.stroke();
      ctx.closePath();
    });
  }, [onDraw]);

  useEffect(() => {
    return onClear(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      saveState(ctx);
    });
  }, [onClear, saveState]);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const r = canvas.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return { x: t.clientX - r.left, y: t.clientY - r.top };
  };

  const lastPos = useRef(null);

  const startDraw = useCallback((e) => {
    e.preventDefault();
    setIsDrawing(true);
    const pos = getPos(e);
    lastPos.current = pos;
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }, []);

  const draw = useCallback((e) => {
    e.preventDefault();
    if (!isDrawing) return;
    const ctx = canvasRef.current.getContext('2d');
    const pos = getPos(e);
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
    ctx.lineWidth = tool === 'eraser' ? size * 3 : size;
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);

    if (lastPos.current) {
      emitDraw({ fromX: lastPos.current.x, fromY: lastPos.current.y, toX: pos.x, toY: pos.y, color: tool === 'eraser' ? '#ffffff' : color, size: tool === 'eraser' ? size * 3 : size });
    }
    lastPos.current = pos;
  }, [isDrawing, color, size, tool, emitDraw]);

  const endDraw = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    lastPos.current = null;
    const ctx = canvasRef.current.getContext('2d');
    saveState(ctx);
  }, [isDrawing, saveState]);

  const undo = () => {
    if (historyIdx <= 0) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx.putImageData(history[historyIdx - 1], 0, 0);
    setHistoryIdx(prev => prev - 1);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveState(ctx);
    emitClear();
  };

  const saveImage = () => {
    const link = document.createElement('a');
    link.download = 'board.png';
    link.href = canvasRef.current.toDataURL();
    link.click();
  };

  return (
    <Layout title="Онлайн-доска">
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 0', flexWrap: 'wrap' }}>
          <button className="btn-sm" onClick={() => setTool('pen')} style={{ background: tool === 'pen' ? 'var(--primary)' : '', color: tool === 'pen' ? '#fff' : '' }}>✏️ Ручка</button>
          <button className="btn-sm" onClick={() => setTool('eraser')} style={{ background: tool === 'eraser' ? 'var(--primary)' : '', color: tool === 'eraser' ? '#fff' : '' }}>🧹 Ластик</button>
          <div className="sep" />
          {COLORS.map(c => (
            <button key={c} onClick={() => setColor(c)} style={{
              width: 24, height: 24, borderRadius: '50%', background: c, border: c === color ? '3px solid var(--primary)' : '2px solid var(--border)', cursor: 'pointer', flexShrink: 0,
            }} />
          ))}
          <div className="sep" />
          {SIZES.map(s => (
            <button key={s} onClick={() => setSize(s)} style={{
              width: 28, height: 28, borderRadius: '50%', background: 'var(--bg2)', border: size === s ? '2px solid var(--primary)' : '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ width: s, height: s, borderRadius: '50%', background: '#333' }} />
            </button>
          ))}
          <div className="sep" />
          <button className="btn-sm" onClick={undo} disabled={historyIdx <= 0} style={{ opacity: historyIdx <= 0 ? 0.4 : 1 }}>↩ Отмена</button>
          <button className="btn-sm" onClick={clear}>🗑 Очистить</button>
          <button className="btn-sm" onClick={saveImage}>💾 Скачать PNG</button>
          {socket?.connected && <span style={{ fontSize: 12, color: 'var(--green)', marginLeft: 8 }}>🟢 Совместный режим</span>}
        </div>
        <div ref={containerRef} style={{ flex: 1, border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
          <canvas
            ref={canvasRef}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={endDraw}
            style={{ width: '100%', height: '100%', cursor: tool === 'eraser' ? 'cell' : 'crosshair', touchAction: 'none' }}
          />
        </div>
      </div>
    </Layout>
  );
}
