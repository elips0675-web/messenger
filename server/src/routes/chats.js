import { Router } from 'express';
import pool from '../db.js';
import { getIO, sendMessageViaSocket } from '../ws.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const [chats] = await pool.query(`
      SELECT c.*,
        (SELECT text FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as lastMsg,
        (SELECT created_at FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as lastTime,
        cm.last_read_at,
        (SELECT COUNT(*) FROM messages WHERE chat_id = c.id AND created_at > COALESCE(cm.last_read_at, '1970-01-01') AND user_id != ?) as unread
      FROM chats c
      JOIN chat_members cm ON c.id = cm.chat_id AND cm.user_id = ?
      ORDER BY lastTime DESC
    `, [req.user.id, req.user.id]);
    res.json(chats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [chats] = await pool.query('SELECT * FROM chats WHERE id = ?', [req.params.id]);
    if (chats.length === 0) return res.status(404).json({ error: 'Chat not found' });
    const [members] = await pool.query(
      'SELECT u.id, u.name, u.avatar FROM chat_members cm JOIN users u ON cm.user_id = u.id WHERE cm.chat_id = ?',
      [req.params.id]
    );
    const [messages] = await pool.query(`
      SELECT m.*, u.name as user_name, u.avatar as user_avatar
      FROM messages m JOIN users u ON m.user_id = u.id
      WHERE m.chat_id = ? ORDER BY m.created_at ASC
    `, [req.params.id]);

    const msgIds = messages.map(m => m.id);
    let reactions = {};
    if (msgIds.length) {
      const [rows] = await pool.query(
        'SELECT message_id, user_id, emoji FROM message_reactions WHERE message_id IN (?)',
        [msgIds]
      );
      rows.forEach(r => {
        if (!reactions[r.message_id]) reactions[r.message_id] = {};
        if (!reactions[r.message_id][r.emoji]) reactions[r.message_id][r.emoji] = [];
        reactions[r.message_id][r.emoji].push(r.user_id);
      });
    }
    const msgsWithReactions = messages.map(m => ({
      ...m,
      reactions: reactions[m.id] || {},
    }));

    res.json({ ...chats[0], members, messages: msgsWithReactions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/messages', async (req, res) => {
  try {
    const { text, image_url, reply_to } = req.body;
    const [result] = await pool.query(
      'INSERT INTO messages (chat_id, user_id, text, image_url, reply_to) VALUES (?, ?, ?, ?, ?)',
      [req.params.id, req.user.id, text, image_url || null, reply_to || null]
    );
    const [msg] = await pool.query(
      'SELECT m.*, u.name as user_name, u.avatar as user_avatar FROM messages m JOIN users u ON m.user_id = u.id WHERE m.id = ?',
      [result.insertId]
    );

    const io = getIO();
    if (io) {
      io.to(`chat:${req.params.id}`).emit('message:new', {
        chatId: Number(req.params.id),
        message: msg[0],
      });
    }

    res.json(msg[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/read', async (req, res) => {
  try {
    await pool.query(
      'UPDATE chat_members SET last_read_at = NOW() WHERE chat_id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:chatId/messages/:msgId/reactions', async (req, res) => {
  try {
    const { emoji } = req.body;
    if (!emoji) return res.status(400).json({ error: 'emoji required' });
    const [existing] = await pool.query(
      'SELECT id FROM message_reactions WHERE message_id = ? AND user_id = ? AND emoji = ?',
      [req.params.msgId, req.user.id, emoji]
    );
    if (existing.length) {
      await pool.query('DELETE FROM message_reactions WHERE id = ?', [existing[0].id]);
      res.json({ added: false, emoji });
    } else {
      await pool.query(
        'INSERT INTO message_reactions (message_id, user_id, emoji) VALUES (?, ?, ?)',
        [req.params.msgId, req.user.id, emoji]
      );
      res.json({ added: true, emoji });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
