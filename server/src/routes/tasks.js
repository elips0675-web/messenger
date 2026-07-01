import { Router } from 'express';
import pool from '../db.js';
import { asyncHandler } from '../middleware.js';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  const { status, assignee } = req.query;
  let sql = `
    SELECT t.*, u1.name as assignee_name, u2.name as creator_name, d.name as dept_name
    FROM tasks t
    LEFT JOIN users u1 ON t.assignee_id = u1.id
    LEFT JOIN users u2 ON t.creator_id = u2.id
    LEFT JOIN departments d ON t.dept_id = d.id
    WHERE 1=1`;
  const params = [];
  if (status) { sql += ' AND t.status = ?'; params.push(status); }
  if (assignee) { sql += ' AND t.assignee_id = ?'; params.push(Number(assignee)); }
  sql += ' ORDER BY t.created_at DESC';
  const [tasks] = await pool.query(sql, params);
  for (const task of tasks) {
    const [subtasks] = await pool.query('SELECT * FROM subtasks WHERE task_id = ?', [task.id]);
    task.subtasks = subtasks;
  }
  res.json(tasks);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const [tasks] = await pool.query(`
    SELECT t.*, u1.name as assignee_name, u2.name as creator_name, d.name as dept_name
    FROM tasks t
    LEFT JOIN users u1 ON t.assignee_id = u1.id
    LEFT JOIN users u2 ON t.creator_id = u2.id
    LEFT JOIN departments d ON t.dept_id = d.id
    WHERE t.id = ?
  `, [req.params.id]);
  if (!tasks.length) return res.status(404).json({ error: 'Task not found' });
  const [subtasks] = await pool.query('SELECT * FROM subtasks WHERE task_id = ?', [req.params.id]);
  tasks[0].subtasks = subtasks;
  const [activity] = await pool.query('SELECT * FROM task_activity WHERE task_id = ? ORDER BY created_at DESC', [req.params.id]);
  tasks[0].activity = activity;
  res.json(tasks[0]);
}));

router.post('/', asyncHandler(async (req, res) => {
  const { title, description, status, priority, assignee_id, dept_id, deadline } = req.body;
  const [result] = await pool.query(
    'INSERT INTO tasks (title, description, status, priority, assignee_id, creator_id, dept_id, deadline) VALUES (?,?,?,?,?,?,?,?)',
    [title, description || '', status || 'todo', priority || 'medium', assignee_id || req.userId, req.userId, dept_id || null, deadline || null]
  );
  const [[task]] = await pool.query('SELECT * FROM tasks WHERE id = ?', [result.insertId]);
  res.status(201).json(task);
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const fields = ['title', 'description', 'status', 'priority', 'assignee_id', 'dept_id', 'deadline'];
  const sets = fields.filter(f => req.body[f] !== undefined).map(f => `${f} = ?`);
  const vals = fields.filter(f => req.body[f] !== undefined).map(f => req.body[f]);
  if (!sets.length) return res.status(400).json({ error: 'No fields' });
  await pool.query(`UPDATE tasks SET ${sets.join(', ')} WHERE id = ?`, [...vals, req.params.id]);
  res.json({ ok: true });
}));

router.patch('/:id/status', asyncHandler(async (req, res) => {
  const { status } = req.body;
  await pool.query('UPDATE tasks SET status = ? WHERE id = ?', [status, req.params.id]);
  res.json({ ok: true });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  await pool.query('DELETE FROM tasks WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
}));

router.post('/:id/subtasks', asyncHandler(async (req, res) => {
  const { title } = req.body;
  const [result] = await pool.query('INSERT INTO subtasks (task_id, title) VALUES (?,?)', [req.params.id, title]);
  const [[st]] = await pool.query('SELECT * FROM subtasks WHERE id = ?', [result.insertId]);
  res.status(201).json(st);
}));

router.put('/:id/subtasks/:subId', asyncHandler(async (req, res) => {
  await pool.query('UPDATE subtasks SET done = ? WHERE id = ?', [req.body.done ? 1 : 0, req.params.subId]);
  res.json({ ok: true });
}));

router.get('/:id/files', asyncHandler(async (req, res) => {
  const [files] = await pool.query('SELECT * FROM task_files WHERE task_id = ? ORDER BY created_at DESC', [req.params.id]);
  res.json(files);
}));

router.post('/:id/files', asyncHandler(async (req, res) => {
  const { name, size, type, data } = req.body;
  const [result] = await pool.query(
    'INSERT INTO task_files (task_id, name, size, type, data, user_id) VALUES (?,?,?,?,?,?)',
    [req.params.id, name, size, type, data, req.userId]
  );
  const [[file]] = await pool.query('SELECT * FROM task_files WHERE id = ?', [result.insertId]);
  res.status(201).json(file);
}));

router.delete('/:id/files/:fileId', asyncHandler(async (req, res) => {
  await pool.query('DELETE FROM task_files WHERE id = ?', [req.params.fileId]);
  res.json({ ok: true });
}));

router.get('/:id/messages', asyncHandler(async (req, res) => {
  const [msgs] = await pool.query(
    'SELECT tm.*, u.name as user_name FROM task_messages tm JOIN users u ON tm.user_id = u.id WHERE tm.task_id = ? ORDER BY tm.created_at ASC',
    [req.params.id]
  );
  res.json(msgs);
}));

router.post('/:id/messages', asyncHandler(async (req, res) => {
  const { text } = req.body;
  const [result] = await pool.query('INSERT INTO task_messages (task_id, user_id, text) VALUES (?,?,?)', [req.params.id, req.userId, text]);
  const [[msg]] = await pool.query('SELECT tm.*, u.name as user_name FROM task_messages tm JOIN users u ON tm.user_id = u.id WHERE tm.id = ?', [result.insertId]);
  res.status(201).json(msg);
}));

export default router;
