import { Router } from 'express';
import pool from '../db.js';
import { asyncHandler } from '../middleware.js';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM timeline_state WHERE user_id = ?', [req.userId]);
  if (rows.length) {
    const state = typeof rows[0].state === 'string' ? JSON.parse(rows[0].state) : rows[0].state;
    return res.json(state);
  }
  res.json([]);
}));

router.put('/', asyncHandler(async (req, res) => {
  await pool.query(
    'INSERT INTO timeline_state (user_id, state) VALUES (?,?) ON DUPLICATE KEY UPDATE state = ?',
    [req.userId, JSON.stringify(req.body), JSON.stringify(req.body)]
  );
  res.json({ ok: true });
}));

export default router;
