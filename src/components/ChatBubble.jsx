import { useState } from 'react';
import { users, FILE_ICONS } from '../data/mockData';

const REACTIONS = ['👍', '❤️', '😄', '😢', '😡', '🔥', '👀'];

function highlightText(text, search) {
  if (!search || !text) return text;
  const parts = text.split(new RegExp(`(${search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return parts.map((p, i) => p.toLowerCase() === search.toLowerCase()
    ? <mark key={i} style={{ background: '#fff3a8', padding: '0 2px', borderRadius: 2 }}>{p}</mark>
    : p);
}

export default function ChatBubble({ message, isMine, onReact, onEdit, onDelete, onThread, onVote, search }) {
  const [showReactions, setShowReactions] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(message.text);
  const user = users.find(u => u.id === message.userId);
  const [previewImg, setPreviewImg] = useState(null);

  const handleReact = (emoji) => {
    onReact?.(message.id, emoji);
    setShowReactions(false);
  };

  const handleEdit = () => {
    if (editText.trim() && editText !== message.text) onEdit?.(message.id, editText);
    setEditing(false);
  };

  const reactions = Object.entries(message.reactions || {});
  const totalReactions = reactions.reduce((s, [, v]) => s + v.length, 0);
  const attachments = message.attachments || [];
  const threadCount = message.thread?.length || 0;
  const isPoll = !!message.poll;

  return (
    <div className={`msg-bubble ${isMine ? 'mine' : 'other'}`}>
      {!isMine && <strong style={{ fontSize: 12, display: 'block', marginBottom: 2 }}>{user?.name}</strong>}

      {editing ? (
        <div style={{ display: 'flex', gap: 6 }}>
          <input value={editText} onChange={e => setEditText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleEdit()}
            style={{ flex: 1, padding: '4px 8px', borderRadius: 6, border: '1px solid var(--primary)', outline: 'none' }} autoFocus />
          <button onClick={handleEdit} style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>✓</button>
          <button onClick={() => setEditing(false)} style={{ fontSize: 12, color: 'var(--text2)' }}>✕</button>
        </div>
      ) : (
        <span>{highlightText(message.text, search)}{message.edited && <span style={{ fontSize: 10, opacity: .5, marginLeft: 4 }}>(ред.)</span>}</span>
      )}

      {/* Poll */}
      {isPoll && message.poll?.options && (
        <div className="poll-container">
          {message.poll.options.map((opt, i) => {
            const total = message.poll.totalVotes || 1;
            const pct = Math.round((opt.votes.length / total) * 100);
            return (
              <div key={i} className="poll-option" onClick={() => onVote?.(message.id, i)}>
                <div className="poll-bar" style={{ width: `${pct}%` }} />
                <span className="poll-text">{opt.text}</span>
                <span className="poll-pct">{pct}%</span>
              </div>
            );
          })}
          <div className="poll-total">{message.poll.totalVotes || 0} голосов</div>
        </div>
      )}

      {/* Attachments */}
      {attachments.length > 0 && (
        <div className="msg-attachments">
          {attachments.map((att, i) => {
            const icon = FILE_ICONS[att.type] || FILE_ICONS.default;
            return (
              <div key={i} className="msg-attach" onClick={() => att.type === 'img' && setPreviewImg(att)}>
                <span>{icon}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500 }}>{att.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--text2)' }}>{att.size}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reactions */}
      {totalReactions > 0 && (
        <div className="msg-reactions">
          {reactions.map(([emoji, ids]) => (
            <span key={emoji} className="msg-reaction" onClick={() => handleReact(emoji)}>{emoji} {ids.length}</span>
          ))}
        </div>
      )}

      <div className="msg-footer">
        <div className="msg-time">
          {message.selfDestruct ? <span style={{ color: 'var(--red)', marginRight: 4 }}>🔥 {message.selfDestruct}с</span> : ''}
          {message.time}
        </div>
        {isMine && <span className={`msg-read ${message.readBy?.length > 0 ? 'read' : ''}`}>{message.readBy?.length > 0 ? '✓✓' : '✓'}</span>}
        <div className="msg-actions">
          <button className="msg-action-btn" onClick={() => setShowReactions(!showReactions)}>😊</button>
          {isMine && (
            <>
              <button className="msg-action-btn" onClick={() => { setEditing(true); setEditText(message.text); }}>✏️</button>
              <button className="msg-action-btn" onClick={() => onDelete?.(message.id)}>🗑️</button>
            </>
          )}
          {!isMine && <button className="msg-action-btn" onClick={() => setShowReactions(!showReactions)}>➕</button>}
          <button className="msg-action-btn" onClick={() => onThread?.(message)} title="Ответить в треде">💬</button>
        </div>
      </div>

      {threadCount > 0 && (
        <div className="msg-thread-link" onClick={() => onThread?.(message)}>
          💬 {threadCount} {threadCount === 1 ? 'ответ' : 'ответов'}
        </div>
      )}

      {showReactions && (
        <div className="reaction-picker">
          {REACTIONS.map(emoji => (
            <span key={emoji} className="reaction-option" onClick={() => handleReact(emoji)}>{emoji}</span>
          ))}
        </div>
      )}

      {previewImg && (
        <div className="lightbox" onClick={() => setPreviewImg(null)}>
          <div className="lightbox-content" onClick={e => e.stopPropagation()}>
            <div className="lightbox-img-placeholder">🖼️ {previewImg.name}</div>
            <button className="send-btn" style={{ marginTop: 12, width: '100%' }} onClick={() => setPreviewImg(null)}>Закрыть</button>
          </div>
        </div>
      )}
    </div>
  );
}
