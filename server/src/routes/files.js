import { Router } from 'express';
import pool from '../db.js';
import { asyncHandler } from '../middleware.js';

const router = Router();

router.get('/folders', asyncHandler(async (req, res) => {
  const [folders] = await pool.query('SELECT * FROM file_folders WHERE user_id = ? OR is_shared = 1 ORDER BY name', [req.userId]);
  for (const f of folders) {
    const [files] = await pool.query('SELECT * FROM files WHERE folder_id = ? ORDER BY created_at DESC', [f.id]);
    f.files = files;
  }
  res.json(folders);
}));

router.post('/folders', asyncHandler(async (req, res) => {
  const { name, parentId } = req.body;
  const [result] = await pool.query(
    'INSERT INTO file_folders (name, parent_id, user_id) VALUES (?,?,?)',
    [name, parentId || null, req.userId]
  );
  const [[folder]] = await pool.query('SELECT * FROM file_folders WHERE id = ?', [result.insertId]);
  res.status(201).json(folder);
}));

router.put('/folders/:id', asyncHandler(async (req, res) => {
  await pool.query('UPDATE file_folders SET name = ? WHERE id = ?', [req.body.name, req.params.id]);
  res.json({ ok: true });
}));

router.delete('/folders/:id', asyncHandler(async (req, res) => {
  await pool.query('DELETE FROM file_folders WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
}));

router.post('/upload', asyncHandler(async (req, res) => {
  const { name, size, type, data, folder_id } = req.body;
  const [result] = await pool.query(
    'INSERT INTO files (name, size, type, data, folder_id, user_id) VALUES (?,?,?,?,?,?)',
    [name, size, type || 'file', data || '', folder_id || null, req.userId]
  );
  const [[file]] = await pool.query('SELECT * FROM files WHERE id = ?', [result.insertId]);
  res.status(201).json(file);
}));

router.put('/:id/rename', asyncHandler(async (req, res) => {
  await pool.query('UPDATE files SET name = ? WHERE id = ?', [req.body.name, req.params.id]);
  res.json({ ok: true });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  await pool.query('DELETE FROM files WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
}));

export default router;
