import { Router } from 'express';
import pool from '../db.js';
import { asyncHandler } from '../middleware.js';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT id, name FROM mindmaps WHERE user_id = ? ORDER BY updated_at DESC', [req.userId]);
  res.json(rows);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM mindmaps WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  const map = rows[0];
  map.nodes = typeof map.nodes === 'string' ? JSON.parse(map.nodes) : map.nodes;
  map.links = typeof map.links === 'string' ? JSON.parse(map.links) : map.links;
  res.json(map);
}));

router.post('/', asyncHandler(async (req, res) => {
  const { name, nodes, links } = req.body;
  const [result] = await pool.query(
    'INSERT INTO mindmaps (name, nodes, links, user_id) VALUES (?,?,?,?)',
    [name || 'Новая карта', JSON.stringify(nodes || []), JSON.stringify(links || []), req.userId]
  );
  const [[map]] = await pool.query('SELECT * FROM mindmaps WHERE id = ?', [result.insertId]);
  res.status(201).json(map);
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const { name, nodes, links } = req.body;
  await pool.query(
    'UPDATE mindmaps SET name = COALESCE(?, name), nodes = COALESCE(?, nodes), links = COALESCE(?, links), updated_at = NOW() WHERE id = ? AND user_id = ?',
    [name || null, nodes ? JSON.stringify(nodes) : null, links ? JSON.stringify(links) : null, req.params.id, req.userId]
  );
  res.json({ ok: true });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  await pool.query('DELETE FROM mindmaps WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
  res.json({ ok: true });
}));

export default router;
