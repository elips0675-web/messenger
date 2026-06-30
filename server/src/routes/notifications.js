import { Router } from 'express';
import pool from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const [notifs] = await pool.query(
      'SELECT id, text, type, readed as `read`, DATE_FORMAT(created_at, "%Y-%m-%d %H:%i") as time FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
      [req.userId]
    );
    res.json(notifs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/read', async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET readed = 1 WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/read-all', async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET readed = 1 WHERE user_id = ?', [req.userId]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM notifications WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/', async (req, res) => {
  try {
    await pool.query('DELETE FROM notifications WHERE user_id = ?', [req.userId]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { text, type } = req.body;
    const [result] = await pool.query(
      'INSERT INTO notifications (user_id, text, type) VALUES (?,?,?)',
      [req.userId, text, type || 'system']
    );
    const [[notif]] = await pool.query('SELECT * FROM notifications WHERE id = ?', [result.insertId]);
    res.status(201).json(notif);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
