import { Router } from 'express';
const router = Router();
import pool from '../db.js';
import { auth } from '../middleware.js';

// List courses
router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.*,
        (SELECT COUNT(*) FROM course_lessons WHERE course_id = c.id) lessons_count,
        (SELECT COUNT(*) FROM quiz_questions WHERE course_id = c.id) questions_count,
        cp.completed, cp.completed_lessons, cp.total_lessons, cp.quiz_score
       FROM courses c
       LEFT JOIN course_progress cp ON cp.course_id = c.id AND cp.user_id = ?
       ORDER BY c.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Create course
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, cover } = req.body;
    if (!title) return res.status(400).json({ error: 'Title required' });
    const [r] = await pool.query(
      `INSERT INTO courses (title, description, cover, author_id) VALUES (?,?,?,?)`,
      [title, description || '', cover || '📚', req.user.id]
    );
    const [rows] = await pool.query(`SELECT * FROM courses WHERE id = ?`, [r.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get course detail
router.get('/:id', auth, async (req, res) => {
  try {
    const [c] = await pool.query(`SELECT * FROM courses WHERE id = ?`, [req.params.id]);
    if (!c.length) return res.status(404).json({ error: 'Not found' });
    res.json(c[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Enroll
router.post('/:id/enroll', auth, async (req, res) => {
  try {
    const [existing] = await pool.query(
      `SELECT id FROM course_progress WHERE course_id = ? AND user_id = ?`,
      [req.params.id, req.user.id]
    );
    if (existing.length) return res.json(existing[0]);

    const [lessons] = await pool.query(
      `SELECT COUNT(*) cnt FROM course_lessons WHERE course_id = ?`, [req.params.id]
    );
    const [r] = await pool.query(
      `INSERT INTO course_progress (course_id, user_id, total_lessons) VALUES (?,?,?)`,
      [req.params.id, req.user.id, lessons[0].cnt]
    );
    const [rows] = await pool.query(`SELECT * FROM course_progress WHERE id = ?`, [r.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Lessons
router.get('/:id/lessons', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM course_lessons WHERE course_id = ? ORDER BY order_index`, [req.params.id]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Add lesson
router.post('/:id/lessons', auth, async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title) return res.status(400).json({ error: 'Title required' });
    const [max] = await pool.query(
      `SELECT COALESCE(MAX(order_index),-1)+1 next FROM course_lessons WHERE course_id=?`, [req.params.id]
    );
    const [r] = await pool.query(
      `INSERT INTO course_lessons (course_id, title, content, order_index) VALUES (?,?,?,?)`,
      [req.params.id, title, content || '', max[0].next]
    );
    // Update total_lessons for enrolled users
    await pool.query(
      `UPDATE course_progress SET total_lessons = (SELECT COUNT(*) FROM course_lessons WHERE course_id = ?)
       WHERE course_id = ?`, [req.params.id, req.params.id]
    );
    const [rows] = await pool.query(`SELECT * FROM course_lessons WHERE id = ?`, [r.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Mark lesson completed
router.post('/:courseId/lessons/:id/complete', auth, async (req, res) => {
  try {
    const [progress] = await pool.query(
      `SELECT * FROM course_progress WHERE course_id = ? AND user_id = ?`,
      [req.params.courseId, req.user.id]
    );
    if (!progress.length) return res.status(404).json({ error: 'Not enrolled' });

    const newVal = Math.min(progress[0].completed_lessons + 1, progress[0].total_lessons);
    const completed = newVal >= progress[0].total_lessons;
    await pool.query(
      `UPDATE course_progress SET completed_lessons = ?, completed = ? WHERE id = ?`,
      [newVal, completed ? 1 : 0, progress[0].id]
    );
    const [rows] = await pool.query(`SELECT * FROM course_progress WHERE id = ?`, [progress[0].id]);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Quiz
router.get('/:id/quiz', auth, async (req, res) => {
  try {
    const [questions] = await pool.query(
      `SELECT qq.*, qa.answer_index user_answer, qa.correct user_correct
       FROM quiz_questions qq
       LEFT JOIN quiz_attempts qa ON qa.question_id = qq.id AND qa.user_id = ?
       WHERE qq.course_id = ? ORDER BY qq.id`,
      [req.user.id, req.params.id]
    );
    // Strip correct_index if user already answered
    const safe = questions.map(q => ({
      ...q,
      correct_index: q.user_answer != null ? q.correct_index : undefined,
    }));
    res.json(safe);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Add quiz question
router.post('/:id/quiz', auth, async (req, res) => {
  try {
    const { question, options, correct_index } = req.body;
    if (!question || !options) return res.status(400).json({ error: 'Question and options required' });
    const [r] = await pool.query(
      `INSERT INTO quiz_questions (course_id, question, options, correct_index) VALUES (?,?,?,?)`,
      [req.params.id, question, JSON.stringify(options), correct_index || 0]
    );
    const [rows] = await pool.query(`SELECT * FROM quiz_questions WHERE id = ?`, [r.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Answer quiz question
router.post('/:courseId/quiz/answer', auth, async (req, res) => {
  try {
    const { question_id, answer_index } = req.body;
    if (!question_id || answer_index == null) return res.status(400).json({ error: 'question_id and answer_index required' });

    // Already answered?
    const [existing] = await pool.query(
      `SELECT id FROM quiz_attempts WHERE question_id = ? AND user_id = ?`,
      [question_id, req.user.id]
    );
    if (existing.length) return res.status(400).json({ error: 'Already answered' });

    const [q] = await pool.query(`SELECT * FROM quiz_questions WHERE id = ?`, [question_id]);
    if (!q.length) return res.status(404).json({ error: 'Question not found' });
    const correct = answer_index === q[0].correct_index;

    await pool.query(
      `INSERT INTO quiz_attempts (question_id, user_id, answer_index, correct) VALUES (?,?,?,?)`,
      [question_id, req.user.id, answer_index, correct]
    );

    // Update quiz score
    if (correct) {
      const [progress] = await pool.query(
        `SELECT id FROM course_progress WHERE course_id = ? AND user_id = ?`,
        [req.params.courseId, req.user.id]
      );
      if (progress.length) {
        await pool.query(
          `UPDATE course_progress SET quiz_score = quiz_score + 1 WHERE id = ?`, [progress[0].id]
        );
      }
    }

    res.json({ correct, correct_index: q[0].correct_index });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Progress
router.get('/:id/progress', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM course_progress WHERE course_id = ? AND user_id = ?`,
      [req.params.id, req.user.id]
    );
    res.json(rows[0] || { completed_lessons: 0, total_lessons: 0, quiz_score: 0, completed: false });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
