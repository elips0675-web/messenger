import { Router } from 'express';
import pool from '../db.js';
import { asyncHandler } from '../middleware.js';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  const [channels] = await pool.query(`
    SELECT ch.*, u.name as owner_name,
      (SELECT COUNT(*) FROM channel_members WHERE channel_id = ch.id) as member_count
    FROM channels ch
    LEFT JOIN users u ON ch.owner_id = u.id
    ORDER BY ch.name
  `);
  for (const ch of channels) {
    const [members] = await pool.query(
      'SELECT user_id FROM channel_members WHERE channel_id = ?',
      [ch.id]
    );
    ch.memberIds = members.map(m => m.user_id);
  }
  res.json(channels);
}));

router.post('/', asyncHandler(async (req, res) => {
  const { name, desc, type } = req.body;
  const [result] = await pool.query(
    'INSERT INTO channels (name, description, type, owner_id) VALUES (?,?,?,?)',
    [name, desc || '', type || 'open', req.userId]
  );
  await pool.query('INSERT INTO channel_members (channel_id, user_id) VALUES (?,?)', [result.insertId, req.userId]);
  const [[channel]] = await pool.query('SELECT * FROM channels WHERE id = ?', [result.insertId]);
  res.status(201).json(channel);
}));

router.post('/:id/join', asyncHandler(async (req, res) => {
  await pool.query('INSERT IGNORE INTO channel_members (channel_id, user_id) VALUES (?,?)', [req.params.id, req.userId]);
  res.json({ ok: true });
}));

router.post('/:id/leave', asyncHandler(async (req, res) => {
  await pool.query('DELETE FROM channel_members WHERE channel_id = ? AND user_id = ?', [req.params.id, req.userId]);
  res.json({ ok: true });
}));

export default router;
