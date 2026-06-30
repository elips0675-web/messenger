import { useState } from 'react';
import { users } from '../data/mockData';

const COLORS = ['#6c5ce7', '#fd79a8', '#00b894', '#fdcb6e', '#0984e3', '#e17055', '#a29bfe', '#55efc4'];

export default function ThreadPanel({ message, chatName, onClose, onSendReply }) {
  const [replyText, setReplyText] = useState('');

  const replies = message.thread || [];

  const sendReply = () => {
    if (!replyText.trim()) return;
    onSendReply?.(message.id, replyText.trim());
    setReplyText('');
  };

  return (
    <div className="thread-panel">
      <div className="thread-header">
        <span style={{ fontWeight: 600, fontSize: 15 }}>Тред</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--text2)' }}>✕</button>
      </div>

      <div className="thread-original">
        <div className="thread-original-user">{message.userId > 0 ? users.find(u => u.id === message.userId)?.name : 'Вы'}</div>
        <div className="thread-original-text">{message.text}</div>
        <div className="thread-original-time">{message.time}</div>
      </div>

      <div className="thread-replies">
        {replies.length === 0 && (
          <div style={{ textAlign: 'center', padding: 20, fontSize: 13, color: 'var(--text2)' }}>
            Нет ответов. Напишите первый ответ.
          </div>
        )}
        {replies.map((reply, i) => {
          const u = users.find(x => x.id === reply.userId);
          const color = COLORS[(reply.userId || 0) % COLORS.length];
          return (
            <div key={i} className="thread-reply">
              <div className="thread-reply-avatar" style={{ background: color }}>{u?.avatar || '?'}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="thread-reply-user">{u?.name || 'Пользователь'}</div>
                <div className="thread-reply-text">{reply.text}</div>
                <div className="thread-reply-time">{reply.time}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="thread-input">
        <input value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Ответить в треде..."
          onKeyDown={e => e.key === 'Enter' && sendReply()} />
        <button className="send-btn" onClick={sendReply} disabled={!replyText.trim()}>→</button>
      </div>
    </div>
  );
}
