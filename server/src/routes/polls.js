import { Router } from 'express';
const router = Router();
import pool from '../db.js';
import { auth, asyncHandler } from '../middleware.js';

// List polls
router.get('/', auth, asyncHandler(async (req, res) => {
    const [rows] = await pool.query(
      `SELECT p.*,
        (SELECT COUNT(*) FROM poll_options WHERE poll_id = p.id) options_count,
        (SELECT COUNT(*) FROM poll_votes WHERE poll_id = p.id) total_votes,
        (SELECT JSON_ARRAYAGG(option_id) FROM poll_votes WHERE poll_id = p.id AND user_id = ?) my_votes
       FROM polls p ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    const parsed = rows.map(r => ({ ...r, my_votes: r.my_votes ? JSON.parse(r.my_votes) : [] }));
    res.json(parsed);
}));

// Create poll
router.post('/', auth, asyncHandler(async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { title, description, options, multiple_choice, anonymous, expires_at } = req.body;
    if (!title || !options?.length) return res.status(400).json({ error: 'Title and options required' });

    const [r] = await conn.query(
      `INSERT INTO polls (title, description, multiple_choice, anonymous, created_by, expires_at) VALUES (?,?,?,?,?,?)`,
      [title, description || '', multiple_choice ? 1 : 0, anonymous ? 1 : 0, req.user.id, expires_at || null]
    );
    for (const opt of options) {
      await conn.query(`INSERT INTO poll_options (poll_id, text) VALUES (?,?)`, [r.insertId, opt]);
    }
    await conn.commit();

    const [poll] = await pool.query(`SELECT * FROM polls WHERE id = ?`, [r.insertId]);
    const [opts] = await pool.query(`SELECT * FROM poll_options WHERE poll_id = ?`, [r.insertId]);
    res.status(201).json({ ...poll[0], options: opts, total_votes: 0, my_votes: [] });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally { conn.release(); }
}));

// Get poll detail
router.get('/:id', auth, asyncHandler(async (req, res) => {
    const [p] = await pool.query(`SELECT * FROM polls WHERE id = ?`, [req.params.id]);
    if (!p.length) return res.status(404).json({ error: 'Not found' });
    const [opts] = await pool.query(
      `SELECT o.*,
        (SELECT COUNT(*) FROM poll_votes WHERE option_id = o.id) votes,
        (SELECT COUNT(*) FROM poll_votes WHERE option_id = o.id AND user_id = ?) > 0 voted
       FROM poll_options o WHERE o.poll_id = ? ORDER BY o.id`,
      [req.user.id, req.params.id]
    );
    const totalVotes = opts.reduce((s, o) => s + o.votes, 0);
    res.json({ ...p[0], options: opts, total_votes: totalVotes });
}));

// Vote
router.post('/:id/vote', auth, asyncHandler(async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { option_id } = req.body;
    if (!option_id) return res.status(400).json({ error: 'option_id required' });

    const [p] = await conn.query(`SELECT * FROM polls WHERE id = ?`, [req.params.id]);
    if (!p.length) return res.status(404).json({ error: 'Not found' });

    if (p[0].multiple_choice) {
      // Toggle vote
      const [existing] = await conn.query(
        `SELECT id FROM poll_votes WHERE poll_id = ? AND option_id = ? AND user_id = ?`,
        [req.params.id, option_id, req.user.id]
      );
      if (existing.length) {
        await conn.query(`DELETE FROM poll_votes WHERE id = ?`, [existing[0].id]);
        await conn.query(`UPDATE poll_options SET votes_count = GREATEST(votes_count - 1, 0) WHERE id = ?`, [option_id]);
      } else {
        await conn.query(`INSERT INTO poll_votes (poll_id, option_id, user_id) VALUES (?,?,?)`,
          [req.params.id, option_id, req.user.id]);
        await conn.query(`UPDATE poll_options SET votes_count = votes_count + 1 WHERE id = ?`, [option_id]);
      }
    } else {
      // Single vote — remove previous, add new
      await conn.query(`DELETE FROM poll_votes WHERE poll_id = ? AND user_id = ?`, [req.params.id, req.user.id]);
      await conn.query(`INSERT INTO poll_votes (poll_id, option_id, user_id) VALUES (?,?,?)`,
        [req.params.id, option_id, req.user.id]);

      // Reset all option counts, recount
      await conn.query(`UPDATE poll_options SET votes_count = 0 WHERE poll_id = ?`, [req.params.id]);
      const [votes] = await conn.query(
        `SELECT option_id, COUNT(*) cnt FROM poll_votes WHERE poll_id = ? GROUP BY option_id`,
        [req.params.id]
      );
      for (const v of votes) {
        await conn.query(`UPDATE poll_options SET votes_count = ? WHERE id = ?`, [v.cnt, v.option_id]);
      }
    }

    await conn.commit();
    const [opts] = await pool.query(
      `SELECT o.*,
        (SELECT COUNT(*) FROM poll_votes WHERE option_id = o.id AND user_id = ?) > 0 voted
       FROM poll_options o WHERE o.poll_id = ? ORDER BY o.id`,
      [req.user.id, req.params.id]
    );
    const totalVotes = opts.reduce((s, o) => s + o.votes, 0);
    const [poll] = await pool.query(`SELECT * FROM polls WHERE id = ?`, [req.params.id]);
    res.json({ ...poll[0], options: opts, total_votes: totalVotes });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally { conn.release(); }
}));

// Delete poll
router.delete('/:id', auth, asyncHandler(async (req, res) => {
    await pool.query(`DELETE FROM polls WHERE id = ?`, [req.params.id]);
    res.json({ ok: true });
}));

export default router;
