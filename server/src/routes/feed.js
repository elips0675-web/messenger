import { Router } from 'express';
import pool from '../db.js';
import { asyncHandler } from '../middleware.js';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  const [posts] = await pool.query(`
    SELECT p.*, u.name as user_name, u.avatar as user_avatar,
      (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as likes_count,
      (SELECT COUNT(*) FROM post_comments WHERE post_id = p.id) as comments_count,
      (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id AND user_id = ?) as liked_by_me
    FROM posts p
    JOIN users u ON p.user_id = u.id
    ORDER BY p.created_at DESC LIMIT 50
  `, [req.user.id]);
  res.json(posts);
}));

router.post('/', asyncHandler(async (req, res) => {
  const { text, image_url } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: 'Текст поста обязателен' });
  const [result] = await pool.query(
    'INSERT INTO posts (user_id, text, image_url) VALUES (?,?,?)',
    [req.user.id, text.trim(), image_url || null]
  );
  const [post] = await pool.query(
    'SELECT p.*, u.name as user_name, u.avatar as user_avatar FROM posts p JOIN users u ON p.user_id = u.id WHERE p.id = ?',
    [result.insertId]
  );
  res.status(201).json(post[0]);
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT user_id FROM posts WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Post not found' });
  if (rows[0].user_id !== req.user.id) return res.status(403).json({ error: 'Access denied' });
  await pool.query('DELETE FROM posts WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
}));

router.post('/:id/like', asyncHandler(async (req, res) => {
  const [existing] = await pool.query(
    'SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?',
    [req.params.id, req.user.id]
  );
  if (existing.length) {
    await pool.query('DELETE FROM post_likes WHERE id = ?', [existing[0].id]);
    res.json({ liked: false });
  } else {
    await pool.query('INSERT INTO post_likes (post_id, user_id) VALUES (?,?)', [req.params.id, req.user.id]);
    res.json({ liked: true });
  }
}));

router.get('/:id/comments', asyncHandler(async (req, res) => {
  const [comments] = await pool.query(`
    SELECT pc.*, u.name as user_name, u.avatar as user_avatar
    FROM post_comments pc JOIN users u ON pc.user_id = u.id
    WHERE pc.post_id = ? ORDER BY pc.created_at ASC
  `, [req.params.id]);
  res.json(comments);
}));

router.post('/:id/comments', asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: 'Текст комментария обязателен' });
  const [result] = await pool.query(
    'INSERT INTO post_comments (post_id, user_id, text) VALUES (?,?,?)',
    [req.params.id, req.user.id, text.trim()]
  );
  const [comment] = await pool.query(
    'SELECT pc.*, u.name as user_name, u.avatar as user_avatar FROM post_comments pc JOIN users u ON pc.user_id = u.id WHERE pc.id = ?',
    [result.insertId]
  );
  res.status(201).json(comment[0]);
}));

router.delete('/:postId/comments/:commentId', asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT user_id FROM post_comments WHERE id = ?', [req.params.commentId]);
  if (!rows.length) return res.status(404).json({ error: 'Comment not found' });
  if (rows[0].user_id !== req.user.id) return res.status(403).json({ error: 'Access denied' });
  await pool.query('DELETE FROM post_comments WHERE id = ?', [req.params.commentId]);
  res.json({ ok: true });
}));

export default router;
