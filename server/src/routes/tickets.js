import { Router } from 'express';
import pool from '../db.js';
import { asyncHandler } from '../middleware.js';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT t.*, u.name as requester_name, a.name as assignee_name
     FROM tickets t
     LEFT JOIN users u ON t.requester_id = u.id
     LEFT JOIN users a ON t.assignee_id = a.id
     ORDER BY t.updated_at DESC`
  );
  res.json(rows);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const [tickets] = await pool.query(
    `SELECT t.*, u.name as requester_name, a.name as assignee_name
     FROM tickets t
     LEFT JOIN users u ON t.requester_id = u.id
     LEFT JOIN users a ON t.assignee_id = a.id
     WHERE t.id = ?`, [req.params.id]
  );
  if (!tickets.length) return res.status(404).json({ message: 'Ticket not found' });
  const [messages] = await pool.query(
    `SELECT tm.*, u.name as user_name FROM ticket_messages tm
     LEFT JOIN users u ON tm.user_id = u.id
     WHERE tm.ticket_id = ? ORDER BY tm.created_at`, [req.params.id]
  );
  res.json({ ...tickets[0], messages });
}));

router.post('/', asyncHandler(async (req, res) => {
  const { subject, description, priority, channel, requester_email, telegram_chat_id } = req.body;
  if (!subject) return res.status(400).json({ message: 'Subject is required' });
  let requester_id = req.user?.id || null;
  if (!requester_id && requester_email) {
    const [users] = await pool.query('SELECT id FROM users WHERE email = ?', [requester_email]);
    if (users.length) requester_id = users[0].id;
  }
  const [result] = await pool.query(
    `INSERT INTO tickets (subject, description, priority, channel, requester_id, telegram_chat_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [subject, description || null, priority || 'medium', channel || 'chat', requester_id, telegram_chat_id || null]
  );
  res.status(201).json({ id: result.insertId });
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const { status, priority, assignee_id } = req.body;
  await pool.query(
    'UPDATE tickets SET status = COALESCE(?, status), priority = COALESCE(?, priority), assignee_id = COALESCE(?, assignee_id), updated_at = NOW() WHERE id = ?',
    [status || null, priority || null, assignee_id || null, req.params.id]
  );
  res.json({ message: 'Updated' });
}));

router.post('/:id/messages', asyncHandler(async (req, res) => {
  const { text, is_internal, channel } = req.body;
  if (!text) return res.status(400).json({ message: 'Text is required' });
  await pool.query(
    'INSERT INTO ticket_messages (ticket_id, user_id, text, is_internal, channel) VALUES (?, ?, ?, ?, ?)',
    [req.params.id, req.user?.id || null, text, is_internal || false, channel || 'web']
  );
  res.status(201).json({ message: 'Message added' });
}));

router.get('/channel/telegram', asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM tickets WHERE channel = ? ORDER BY updated_at DESC', ['telegram']);
  res.json(rows);
}));

export default router;
