import { Router } from 'express';
import pool from '../db.js';
import { asyncHandler } from '../middleware.js';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  const { year, month } = req.query;
  let query = 'SELECT * FROM events WHERE 1=1';
  const params = [];
  if (year && month) {
    query += ' AND YEAR(date) = ? AND MONTH(date) = ?';
    params.push(Number(year), Number(month));
  }
  query += ' ORDER BY date, time ASC';
  const [events] = await pool.query(query, params);
  res.json(events);
}));

router.post('/', asyncHandler(async (req, res) => {
  const { title, date, time, desc } = req.body;
  const [result] = await pool.query(
    'INSERT INTO events (title, date, time, description, creator_id) VALUES (?,?,?,?,?)',
    [title, date, time || null, desc || '', req.userId]
  );
  const [[event]] = await pool.query('SELECT * FROM events WHERE id = ?', [result.insertId]);
  res.status(201).json(event);
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  await pool.query('DELETE FROM events WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
}));

export default router;
