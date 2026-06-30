import { Router } from 'express';
import pool from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM kanban_state WHERE user_id = ?', [req.userId]);
    if (rows.length) {
      const state = typeof rows[0].state === 'string' ? JSON.parse(rows[0].state) : rows[0].state;
      return res.json(state);
    }
    res.json({ columns: [
      { id: 'todo', label: 'К выполнению', color: '#f3f4f6' },
      { id: 'progress', label: 'В работе', color: '#fffbeb' },
      { id: 'done', label: 'Готово', color: '#f0fdf4' },
    ], tasks: [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/', async (req, res) => {
  try {
    await pool.query(
      'INSERT INTO kanban_state (user_id, state) VALUES (?,?) ON DUPLICATE KEY UPDATE state = ?',
      [req.userId, JSON.stringify(req.body), JSON.stringify(req.body)]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
