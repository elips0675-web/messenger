import { Router } from 'express';
import pool from '../db.js';
import { asyncHandler } from '../middleware.js';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  const [projects] = await pool.query(`
    SELECT p.*, u.name as lead_name, d.name as dept_name,
      (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count
    FROM projects p
    LEFT JOIN users u ON p.lead_id = u.id
    LEFT JOIN departments d ON p.dept_id = d.id
    ORDER BY p.created_at DESC
  `);
  for (const proj of projects) {
    const [members] = await pool.query(
      'SELECT u.id, u.name, u.email, u.avatar FROM project_members pm JOIN users u ON pm.user_id = u.id WHERE pm.project_id = ?',
      [proj.id]
    );
    proj.members = members;
    const [tasks] = await pool.query('SELECT id, title, status FROM tasks WHERE project_id = ?', [proj.id]);
    proj.tasks = tasks;
  }
  res.json(projects);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const [projects] = await pool.query(`
    SELECT p.*, u.name as lead_name, d.name as dept_name
    FROM projects p
    LEFT JOIN users u ON p.lead_id = u.id
    LEFT JOIN departments d ON p.dept_id = d.id
    WHERE p.id = ?
  `, [req.params.id]);
  if (!projects.length) return res.status(404).json({ error: 'Project not found' });
  const proj = projects[0];
  const [members] = await pool.query(
    'SELECT u.id, u.name, u.email, u.avatar FROM project_members pm JOIN users u ON pm.user_id = u.id WHERE pm.project_id = ?',
    [proj.id]
  );
  proj.members = members;
  const [tasks] = await pool.query('SELECT * FROM tasks WHERE project_id = ?', [proj.id]);
  proj.tasks = tasks;
  const [files] = await pool.query('SELECT * FROM project_files WHERE project_id = ? ORDER BY created_at DESC', [proj.id]);
  proj.files = files;
  const [wiki] = await pool.query('SELECT content FROM project_wiki WHERE project_id = ?', [proj.id]);
  proj.wiki = wiki[0]?.content || '';
  res.json(proj);
}));

router.post('/', asyncHandler(async (req, res) => {
  const { name, desc, icon, lead_id, dept_id, deadline, status } = req.body;
  const [result] = await pool.query(
    'INSERT INTO projects (name, description, icon, lead_id, dept_id, deadline, status) VALUES (?,?,?,?,?,?,?)',
    [name, desc || '', icon || '📁', lead_id || req.userId, dept_id || null, deadline || null, status || 'active']
  );
  await pool.query('INSERT INTO project_members (project_id, user_id) VALUES (?,?)', [result.insertId, req.userId]);
  if (lead_id && lead_id !== req.userId) {
    await pool.query('INSERT IGNORE INTO project_members (project_id, user_id) VALUES (?,?)', [result.insertId, lead_id]);
  }
  const [[proj]] = await pool.query('SELECT * FROM projects WHERE id = ?', [result.insertId]);
  res.status(201).json(proj);
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const fields = ['name', 'description', 'icon', 'status', 'deadline', 'lead_id', 'dept_id'];
  const sets = fields.filter(f => req.body[f] !== undefined).map(f => `${f === 'description' ? 'description' : f} = ?`);
  const vals = fields.filter(f => req.body[f] !== undefined).map(f => req.body[f]);
  if (!sets.length) return res.status(400).json({ error: 'No fields to update' });
  await pool.query(`UPDATE projects SET ${sets.join(', ')} WHERE id = ?`, [...vals, req.params.id]);
  res.json({ ok: true });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  await pool.query('DELETE FROM projects WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
}));

router.post('/:id/members', asyncHandler(async (req, res) => {
  const { userId } = req.body;
  await pool.query('INSERT IGNORE INTO project_members (project_id, user_id) VALUES (?,?)', [req.params.id, userId]);
  const [[user]] = await pool.query('SELECT id, name, email, avatar FROM users WHERE id = ?', [userId]);
  res.status(201).json(user);
}));

router.delete('/:id/members/:userId', asyncHandler(async (req, res) => {
  await pool.query('DELETE FROM project_members WHERE project_id = ? AND user_id = ?', [req.params.id, req.params.userId]);
  res.json({ ok: true });
}));

router.get('/:id/files', asyncHandler(async (req, res) => {
  const [files] = await pool.query('SELECT * FROM project_files WHERE project_id = ? ORDER BY created_at DESC', [req.params.id]);
  res.json(files);
}));

router.post('/:id/files', asyncHandler(async (req, res) => {
  const { name, size, type, data } = req.body;
  const [result] = await pool.query(
    'INSERT INTO project_files (project_id, name, size, type, data, user_id) VALUES (?,?,?,?,?,?)',
    [req.params.id, name, size, type, data, req.userId]
  );
  const [[file]] = await pool.query('SELECT * FROM project_files WHERE id = ?', [result.insertId]);
  res.status(201).json(file);
}));

router.delete('/:id/files/:fileId', asyncHandler(async (req, res) => {
  await pool.query('DELETE FROM project_files WHERE id = ?', [req.params.fileId]);
  res.json({ ok: true });
}));

router.put('/:id/wiki', asyncHandler(async (req, res) => {
  const { content } = req.body;
  await pool.query(
    'INSERT INTO project_wiki (project_id, content) VALUES (?,?) ON DUPLICATE KEY UPDATE content = ?',
    [req.params.id, content, content]
  );
  res.json({ ok: true });
}));

export default router;
