import { Router } from 'express';
import pool from '../db.js';
import { asyncHandler } from '../middleware.js';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q) return res.json({ messages: [], tasks: [], chats: [], files: [] });
  const like = `%${q}%`;

  const [msgs] = await pool.query(
    'SELECT m.*, u.name as user_name FROM messages m JOIN users u ON m.user_id = u.id WHERE m.text LIKE ? ORDER BY m.created_at DESC LIMIT 20',
    [like]
  );
  const [tasks] = await pool.query(
    'SELECT id, title, status FROM tasks WHERE title LIKE ? OR description LIKE ? LIMIT 20',
    [like, like]
  );
  const [chats] = await pool.query(
    'SELECT id, name, type FROM chats WHERE name LIKE ? LIMIT 10',
    [like]
  );

  res.json({ messages: msgs || [], tasks: tasks || [], chats: chats || [], files: [] });
}));

router.get('/messages', asyncHandler(async (req, res) => {
  const { query, sender, chatId, dateFrom, dateTo } = req.query;
  let sql = `
    SELECT m.*, u.name as user_name, c.name as chat_name, c.id as chat_id
    FROM messages m
    JOIN users u ON m.user_id = u.id
    JOIN chat_members cm ON m.chat_id = cm.chat_id AND cm.user_id = ?
    JOIN chats c ON m.chat_id = c.id
    WHERE 1=1`;
  const params = [req.userId];

  if (query) { sql += ' AND m.text LIKE ?'; params.push(`%${query}%`); }
  if (sender) { sql += ' AND m.user_id = ?'; params.push(Number(sender)); }
  if (chatId) { sql += ' AND m.chat_id = ?'; params.push(Number(chatId)); }
  if (dateFrom) { sql += ' AND DATE(m.created_at) >= ?'; params.push(dateFrom); }
  if (dateTo) { sql += ' AND DATE(m.created_at) <= ?'; params.push(dateTo); }

  sql += ' ORDER BY m.created_at DESC LIMIT 200';
  const [rows] = await pool.query(sql, params);
  res.json(rows);
}));

export default router;
