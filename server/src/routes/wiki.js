import { Router } from 'express';
import pool from '../db.js';
import { asyncHandler } from '../middleware.js';

const router = Router();

router.get('/categories', asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT *, (SELECT COUNT(*) FROM wiki_articles WHERE category_id = wc.id) as articles_count FROM wiki_categories wc ORDER BY name');
  res.json(rows);
}));

router.post('/categories', asyncHandler(async (req, res) => {
  const { name, icon } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Название обязательно' });
  const [result] = await pool.query('INSERT INTO wiki_categories (name, icon) VALUES (?,?)', [name.trim(), icon || '📂']);
  const [[cat]] = await pool.query('SELECT * FROM wiki_categories WHERE id = ?', [result.insertId]);
  res.status(201).json(cat);
}));

router.delete('/categories/:id', asyncHandler(async (req, res) => {
  await pool.query('DELETE FROM wiki_categories WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
}));

router.get('/', asyncHandler(async (req, res) => {
  const { category, q } = req.query;
  let sql = `SELECT wa.*, u.name as author_name, wc.name as category_name, wc.icon as category_icon
    FROM wiki_articles wa
    LEFT JOIN users u ON wa.author_id = u.id
    LEFT JOIN wiki_categories wc ON wa.category_id = wc.id
    WHERE wa.status = 'published'`;
  const params = [];
  if (category) { sql += ' AND wa.category_id = ?'; params.push(Number(category)); }
  if (q) { sql += ' AND (wa.title LIKE ? OR wa.content LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }
  sql += ' ORDER BY wa.updated_at DESC';
  const [rows] = await pool.query(sql, params);
  res.json(rows);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const [rows] = await pool.query(`
    SELECT wa.*, u.name as author_name, wc.name as category_name, wc.icon as category_icon
    FROM wiki_articles wa
    LEFT JOIN users u ON wa.author_id = u.id
    LEFT JOIN wiki_categories wc ON wa.category_id = wc.id
    WHERE wa.id = ?
  `, [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Article not found' });
  await pool.query('UPDATE wiki_articles SET views = views + 1 WHERE id = ?', [req.params.id]);
  res.json(rows[0]);
}));

router.post('/', asyncHandler(async (req, res) => {
  const { title, content, category_id } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'Заголовок обязателен' });
  const [result] = await pool.query(
    'INSERT INTO wiki_articles (title, content, category_id, author_id) VALUES (?,?,?,?)',
    [title.trim(), content || '', category_id || null, req.user.id]
  );
  const [[article]] = await pool.query(
    'SELECT wa.*, u.name as author_name FROM wiki_articles wa JOIN users u ON wa.author_id = u.id WHERE wa.id = ?',
    [result.insertId]
  );
  res.status(201).json(article);
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const { title, content, category_id, status } = req.body;
  const fields = [];
  const vals = [];
  if (title !== undefined) { fields.push('title = ?'); vals.push(title.trim()); }
  if (content !== undefined) { fields.push('content = ?'); vals.push(content); }
  if (category_id !== undefined) { fields.push('category_id = ?'); vals.push(category_id || null); }
  if (status !== undefined) { fields.push('status = ?'); vals.push(status); }
  if (!fields.length) return res.status(400).json({ error: 'No fields' });
  await pool.query(`UPDATE wiki_articles SET ${fields.join(', ')} WHERE id = ?`, [...vals, req.params.id]);
  res.json({ ok: true });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  await pool.query('DELETE FROM wiki_articles WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
}));

export default router;
