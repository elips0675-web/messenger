import { useParams, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import Layout from '../components/Layout';
import ChatBubble from '../components/ChatBubble';
import CallModal from '../components/CallModal';
import ConferenceModal from '../components/ConferenceModal';
import ThreadPanel from '../components/ThreadPanel';
import { api } from '../lib/api';
import { useWebSocket } from '../hooks/useWebSocket';
import { useCall } from '../hooks/useCall';
import { parseCommand } from '../lib/commands';
const FILE_ICONS = { img: '🖼️', pdf: '📄', doc: '📝', code: '💻', default: '📁' };

let msgIdCounter = Date.now();

export default function Chat() {
  const { id } = useParams();
  const navigate = useNavigate();
  const msgEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const currentId = useRef(id);
  const [chat, setChat] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [searchSender, setSearchSender] = useState('');
  const [searchDateFrom, setSearchDateFrom] = useState('');
  const [searchDateTo, setSearchDateTo] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [typing, setTyping] = useState(false);
  const [attachFiles, setAttachFiles] = useState([]);
  const [showCallMenu, setShowCallMenu] = useState(false);
  const [showConference, setShowConference] = useState(false);
  const [threadMsg, setThreadMsg] = useState(null);
  const [showCmdHelp, setShowCmdHelp] = useState(false);
  const [selfDestruct, setSelfDestruct] = useState(0);
  const [showExport, setShowExport] = useState(false);
  const [users, setUsers] = useState([]);
  const token = localStorage.getItem('messenger_token');
  const { socket, connected } = useWebSocket(token);
  const me = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    currentId.current = id;
    api.get(`/chats/${id}`).then(data => {
      if (currentId.current !== id) return;
      setChat(data);
      setMsgs(data.messages || []);
      if (data.members) setUsers(data.members);
    }).catch(() => {
      if (currentId.current !== id) return;
      import('../data/mockData').then(m => {
        const c = m.chats.find(x => x.id === Number(id));
        if (c) { setChat(c); setMsgs(c.messages || []); }
      });
    });
    api.put(`/chats/${id}/read`).catch(() => {});
    return () => { currentId.current = null; };
  }, [id]);

  useEffect(() => {
    if (!socket) return;
    const onMsg = (data) => {
      if (String(data.chatId) === String(id)) {
        setMsgs(prev => [...prev, data.message]);
      }
    };
    socket.on('message:new', onMsg);
    socket.emit('join:chat', Number(id));
    return () => {
      socket.off('message:new', onMsg);
      socket.emit('leave:chat', Number(id));
    };
  }, [socket, id]);

  const isPersonal = chat?.type === 'personal';
  const otherUser = isPersonal ? users.find(u => u.id === (chat?.userId || chat?.user_id)) : null;

  const { callState, isVideo, isAudio, remoteStream, startCall, acceptCall, endCall, toggleAudio, toggleVideo } = useCall({
    socket, localUserId: me.id || 1, remoteUserId: otherUser?.id, userName: otherUser?.name,
  });

  useEffect(() => {
    if (!socket || !isPersonal) return;
    const onRing = (data) => { if (data.fromUserId === otherUser?.id) startCall(); };
    const onEnded = () => endCall();
    socket.on('call:ring', onRing);
    socket.on('call:ended', onEnded);
    return () => { socket.off('call:ring', onRing); socket.off('call:ended', onEnded); };
  }, [socket, isPersonal, otherUser, startCall, endCall]);

  useEffect(() => { msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  if (!chat) return <Layout title="Чат не найден" showBack onBack={() => navigate('/chats')}><p>Чат не найден</p></Layout>;

  const escHtml = (s) => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);

  const exportChat = (fmt) => {
    if (fmt === 'pdf') {
      const w = window.open('', '_blank');
      if (!w) return;
      const title = escHtml(chat.name);
      const meta = escHtml(new Date().toLocaleString('ru-RU'));
      w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
        <style>body{font-family:sans-serif;padding:20px;max-width:700px;margin:0 auto}
        h1{font-size:18px;margin-bottom:4px}.meta{color:#888;font-size:12px;margin-bottom:20px}
        .msg{margin-bottom:12px}.usr{font-weight:700;font-size:13px}.txt{font-size:14px;margin:2px 0}.tm{font-size:11px;color:#888}
        hr{border:none;border-top:1px solid #eee;margin:20px 0}
        @media print{body{padding:0}}</style></head><body>
        <h1>${title}</h1>
        <div class="meta">Экспортировано: ${meta} • Сообщений: ${msgs.length}</div>
        <hr>`);
      msgs.forEach(m => {
        const u = users.find(x => x.id === (m.userId || m.user_id));
        const name = escHtml(u?.name || '—');
        const text = escHtml(m.text || '');
        const time = escHtml(m.time || m.created_at || '');
        w.document.write(`<div class="msg"><div class="usr">${name}</div><div class="txt">${text}</div><div class="tm">${time}</div></div>`);
      });
      w.document.write('</body></html>');
      w.document.close();
      setTimeout(() => { w.print(); w.close(); }, 300);
      setShowExport(false);
      return;
    }
    const data = { chat: chat.name, exported: new Date().toISOString(), messages: msgs };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `chat_${chat.name.replace(/\s+/g, '_')}.json`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    setShowExport(false);
  };

  const send = async () => {
    if (!input.trim() && attachFiles.length === 0) return;

    const cmd = parseCommand(input.trim());
    if (cmd) {
      cmd.handler(cmd.args, (err, result) => {
        addMsg(err || (result ? result.text : '') || 'Ошибка', result?.poll ? { poll: result.poll } : {});
      });
      setInput('');
      return;
    }

    const text = input.trim();
    setInput('');

    try {
      const msg = await api.post(`/chats/${id}/messages`, { text });
      setMsgs(prev => [...prev, msg]);
      if (socket) {
        socket.emit('message:send', { chatId: Number(id), message: msg });
      }
    } catch {
      addMsg(text);
    }
    setAttachFiles([]);
  };

  const addMsg = (text, extra = {}) => {
    const newMsg = {
      id: ++msgIdCounter, user_id: me.id || 1, userId: me.id || 1, text: String(text || '').trim(),
      time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      reactions: {}, readBy: [], edited: false,
      ...extra,
    };
    setMsgs(prev => [...prev, newMsg]);
  };

  const handleReact = async (msgId, emoji) => {
    const prevMsgs = [...msgs];
    setMsgs(prev => prev.map(m => {
      if (m.id !== msgId) return m;
      const r = { ...(m.reactions || {}) };
      const list = r[emoji] || [];
      if (list.includes(me.id || 1)) {
        r[emoji] = list.filter(x => x !== (me.id || 1));
        if (r[emoji].length === 0) delete r[emoji];
      } else {
        r[emoji] = [...list, me.id || 1];
      }
      return { ...m, reactions: r };
    }));
    try { await api.post(`/chats/${id}/messages/${msgId}/reactions`, { emoji }); } catch { setMsgs(prevMsgs); }
  };

  const handleEdit = async (msgId, text) => {
    setMsgs(prev => prev.map(m => m.id === msgId ? { ...m, text, edited: true } : m));
    try { await api.patch(`/chats/${id}/messages/${msgId}`, { text }); } catch {}
  };

  const handleDelete = async (msgId) => {
    setMsgs(prev => prev.filter(m => m.id !== msgId));
    try { await api.delete(`/chats/${id}/messages/${msgId}`); } catch {}
  };

  const handleThreadReply = (msgId, text) => {
    setMsgs(prev => prev.map(m => {
      if (m.id !== msgId) return m;
      const reply = { userId: me.id || 1, user_id: me.id || 1, text, time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) };
      return { ...m, thread: [...(m.thread || []), reply] };
    }));
  };

  const handleVote = (msgId, optIdx) => {
    setMsgs(prev => prev.map(m => {
      if (m.id !== msgId || !m.poll) return m;
      const poll = { ...m.poll };
      poll.options = poll.options.map((o, i) => i === optIdx ? { ...o, votes: [...o.votes, me.id || 1] } : o);
      poll.totalVotes = (poll.totalVotes || 0) + 1;
      return { ...m, poll };
    }));
  };

  const filteredMsgs = msgs.filter(m => {
    const txt = !search || m.text?.toLowerCase().includes(search.toLowerCase());
    const sender = !searchSender || String(m.userId || m.user_id) === searchSender;
    const dateFrom = !searchDateFrom || (m.time && m.time >= searchDateFrom) || (m.created_at && m.created_at >= searchDateFrom);
    const dateTo = !searchDateTo || (m.time && m.time <= searchDateTo) || (m.created_at && m.created_at <= searchDateTo);
    return txt && sender && dateFrom && dateTo;
  });

  const typingTimeout = useRef(null);
  const handleTyping = (e) => {
    setInput(e.target.value);
    if (e.target.value.startsWith('/')) { setShowCmdHelp(true); } else { setShowCmdHelp(false); }
    if (!typing) setTyping(true);
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => setTyping(false), 1500);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    const attachments = files.map((f, i) => {
      const ext = f.name.split('.').pop().toLowerCase();
      const imgExts = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'];
      const type = imgExts.includes(ext) ? 'img' : ext;
      const size = f.size > 1024 * 1024 ? `${(f.size / 1024 / 1024).toFixed(1)} MB` : `${Math.round(f.size / 1024)} KB`;
      return { id: Date.now() + i, name: f.name, size, type };
    });
    setAttachFiles([...attachFiles, ...attachments]);
    e.target.value = '';
  };

  const removeAttach = (id) => setAttachFiles(attachFiles.filter(a => a.id !== id));

  return (
    <Layout title={isPersonal ? otherUser?.name || chat.name : chat.name} showBack onBack={() => navigate('/chats')}>
      <div style={{ display: 'flex', height: 'calc(100vh - 108px)', gap: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
          <div style={{ padding: '8px 16px', fontSize: 12, color: 'var(--text2)', borderBottom: '1px solid var(--border)', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {isPersonal ? (
                <span style={{ color: otherUser?.online ? '#22c55e' : 'var(--text2)' }}>● {otherUser?.online ? 'в сети' : otherUser?.lastSeen || otherUser?.last_seen}</span>
              ) : (
                <span>👥 {chat.member_count || chat.members?.length || 0} участников</span>
              )}
              {connected && <span style={{ fontSize: 11, color: '#22c55e' }}>🟢 real-time</span>}
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {!isPersonal && (
                <button onClick={() => setShowConference(true)} style={{ fontSize: 13, color: 'var(--primary)', padding: '4px 8px' }} title="Видеоконференция">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                  </svg>
                </button>
              )}
              {isPersonal && (
                <div style={{ position: 'relative' }}>
                  <button onClick={() => setShowCallMenu(!showCallMenu)} style={{ fontSize: 13, color: 'var(--primary)', padding: '4px 8px' }} title="Позвонить">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  </button>
                  {showCallMenu && (
                    <div className="call-menu">
                      <button onClick={() => { startCall(true); setShowCallMenu(false); }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>
                        Видеозвонок
                      </button>
                      <button onClick={() => { startCall(false); setShowCallMenu(false); }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                        Аудиозвонок
                      </button>
                    </div>
                  )}
                </div>
              )}
              <div style={{ position: 'relative' }}>
                <button onClick={() => setShowExport(!showExport)} style={{ fontSize: 13, color: 'var(--text2)', padding: '4px 8px' }} title="Экспорт чата">📥</button>
                {showExport && (
                  <div className="call-menu" style={{ minWidth: 160, right: 0 }}>
                    <button onClick={() => exportChat('json')}>📥 Экспорт JSON</button>
                    <button onClick={() => exportChat('pdf')}>📄 Экспорт PDF</button>
                  </div>
                )}
              </div>
              <button onClick={() => setShowSearch(!showSearch)} style={{ fontSize: 13, color: 'var(--text2)', padding: '4px 8px' }}>🔍</button>
            </div>
          </div>

          {showSearch && (
            <div style={{ padding: '0 16px 8px' }}>
              <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск в чате..."
                style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--primary)', borderRadius: 8, outline: 'none', fontSize: 13, boxSizing: 'border-box' }} />
              <div style={{ display: 'flex', gap: 6, marginTop: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                <select value={searchSender} onChange={e => setSearchSender(e.target.value)} className="btn-sm" style={{ fontSize: 12 }}>
                  <option value="">Все отправители</option>
                  {users.filter(u => msgs.some(m => (m.userId || m.user_id) === u.id)).map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
                <input type="date" value={searchDateFrom} onChange={e => setSearchDateFrom(e.target.value)}
                  style={{ padding: '4px 8px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, outline: 'none' }} />
                <span style={{ fontSize: 12, color: 'var(--text2)' }}>—</span>
                <input type="date" value={searchDateTo} onChange={e => setSearchDateTo(e.target.value)}
                  style={{ padding: '4px 8px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, outline: 'none' }} />
                <span style={{ fontSize: 12, color: 'var(--text2)' }}>Найдено: {filteredMsgs.length}</span>
              </div>
            </div>
          )}

          <div className="msg-area">
            {filteredMsgs.length === 0 && !search && <div style={{ textAlign: 'center', padding: 40, color: 'var(--text2)' }}>Нет сообщений. Напишите что-нибудь!</div>}
            {filteredMsgs.length === 0 && search && <div style={{ textAlign: 'center', padding: 40, color: 'var(--text2)' }}>Ничего не найдено</div>}
            {filteredMsgs.map(msg => (
              <ChatBubble key={msg.id} message={msg} isMine={(msg.userId || msg.user_id) === (me.id || 1)} onReact={handleReact} onEdit={handleEdit} onDelete={handleDelete}
                onThread={(m) => setThreadMsg(m)} onVote={handleVote} search={search} />
            ))}
            {typing && isPersonal && <div style={{ fontSize: 12, color: 'var(--text2)', padding: '4px 0' }}>{otherUser?.name} печатает...</div>}
            <div ref={msgEndRef} />
          </div>

          {attachFiles.length > 0 && (
            <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, flexWrap: 'wrap', background: 'var(--surface)' }}>
              {attachFiles.map(a => {
                const icon = FILE_ICONS[a.type] || FILE_ICONS.default;
                return (
                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}>
                    <span>{icon}</span>
                    <span>{a.name}</span>
                    <button onClick={() => removeAttach(a.id)} style={{ color: 'var(--red)', marginLeft: 4, fontSize: 14 }}>✕</button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="msg-input-area" style={{ position: 'relative' }}>
            {showCmdHelp && (
              <div className="cmd-help">
                <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>Команды:</div>
                <div><code>/poll "Вопрос" "Вар1" "Вар2"</code> <span style={{ fontSize: 11, color: 'var(--text2)' }}>— опрос</span></div>
                <div><code>/remind "текст" через 30м</code> <span style={{ fontSize: 11, color: 'var(--text2)' }}>— напоминание</span></div>
                <div><code>/help</code> <span style={{ fontSize: 11, color: 'var(--text2)' }}>— список команд</span></div>
              </div>
            )}
            <button onClick={() => fileInputRef.current?.click()} style={{ fontSize: 20, padding: '4px 8px' }}>📎</button>
            <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }} onChange={handleFileSelect} />
            <input value={input} onChange={handleTyping} placeholder="Написать сообщение... (/ — команды)" onKeyDown={e => e.key === 'Enter' && send()} />
            <button className="btn-sm" onClick={() => setSelfDestruct(selfDestruct ? 0 : 30)} title="Самоуничтожение" style={{ color: selfDestruct ? 'var(--red)' : 'var(--text2)', border: selfDestruct ? '1px solid var(--red)' : '' }}>
              {selfDestruct ? `🔥 ${selfDestruct}с` : '🔥'}
            </button>
            <button className="send-btn" onClick={send}>Отправить</button>
          </div>
        </div>

        {threadMsg && (
          <ThreadPanel
            message={threadMsg}
            chatName={chat.name}
            onClose={() => setThreadMsg(null)}
            onSendReply={handleThreadReply}
          />
        )}
      </div>

      {callState !== 'idle' && (
        <CallModal
          callState={callState} isVideo={isVideo} isAudio={isAudio}
          remoteStream={remoteStream} localStream={null}
          onAccept={acceptCall} onEnd={endCall}
          onToggleVideo={toggleVideo} onToggleAudio={toggleAudio}
          userName={otherUser?.name} incoming={callState === 'ringing'}
        />
      )}

      {showConference && (
        <ConferenceModal
          roomName={`chat_${chat.id}_${Date.now()}`}
          userName={me.name || 'Пользователь'}
          onClose={() => setShowConference(false)}
        />
      )}
    </Layout>
  );
}
