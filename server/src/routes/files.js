import { Router } from 'express';
import pool from '../db.js';

const router = Router();

router.get('/folders', async (req, res) => {
  try {
    const [folders] = await pool.query('SELECT * FROM file_folders WHERE user_id = ? OR is_shared = 1 ORDER BY name', [req.userId]);
    for (const f of folders) {
      const [files] = await pool.query('SELECT * FROM files WHERE folder_id = ? ORDER BY created_at DESC', [f.id]);
      f.files = files;
    }
    res.json(folders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/folders', async (req, res) => {
  try {
    const { name, parentId } = req.body;
    const [result] = await pool.query(
      'INSERT INTO file_folders (name, parent_id, user_id) VALUES (?,?,?)',
      [name, parentId || null, req.userId]
    );
    const [[folder]] = await pool.query('SELECT * FROM file_folders WHERE id = ?', [result.insertId]);
    res.status(201).json(folder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/folders/:id', async (req, res) => {
  try {
    await pool.query('UPDATE file_folders SET name = ? WHERE id = ?', [req.body.name, req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/folders/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM file_folders WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/upload', async (req, res) => {
  try {
    const { name, size, type, data, folder_id } = req.body;
    const [result] = await pool.query(
      'INSERT INTO files (name, size, type, data, folder_id, user_id) VALUES (?,?,?,?,?,?)',
      [name, size, type || 'file', data || '', folder_id || null, req.userId]
    );
    const [[file]] = await pool.query('SELECT * FROM files WHERE id = ?', [result.insertId]);
    res.status(201).json(file);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/rename', async (req, res) => {
  try {
    await pool.query('UPDATE files SET name = ? WHERE id = ?', [req.body.name, req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM files WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
