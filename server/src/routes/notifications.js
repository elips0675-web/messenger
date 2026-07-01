import { Router } from 'express';
import pool from '../db.js';
import { asyncHandler } from '../middleware.js';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  const [notifs] = await pool.query(
    'SELECT id, text, type, readed as `read`, DATE_FORMAT(created_at, "%Y-%m-%d %H:%i") as time FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
    [req.userId]
  );
  res.json(notifs);
}));

router.put('/:id/read', asyncHandler(async (req, res) => {
  await pool.query('UPDATE notifications SET readed = 1 WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
  res.json({ ok: true });
}));

router.put('/read-all', asyncHandler(async (req, res) => {
  await pool.query('UPDATE notifications SET readed = 1 WHERE user_id = ?', [req.userId]);
  res.json({ ok: true });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  await pool.query('DELETE FROM notifications WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
  res.json({ ok: true });
}));

router.delete('/', asyncHandler(async (req, res) => {
  await pool.query('DELETE FROM notifications WHERE user_id = ?', [req.userId]);
  res.json({ ok: true });
}));

router.post('/', asyncHandler(async (req, res) => {
  const { text, type } = req.body;
  const [result] = await pool.query(
    'INSERT INTO notifications (user_id, text, type) VALUES (?,?,?)',
    [req.userId, text, type || 'system']
  );
  const [[notif]] = await pool.query('SELECT * FROM notifications WHERE id = ?', [result.insertId]);
  res.status(201).json(notif);
}));

export default router;
