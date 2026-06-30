import { Router } from 'express';
import pool from '../db.js';

const router = Router();

router.get('/departments', async (req, res) => {
  try {
    const [depts] = await pool.query(
      'SELECT d.*, (SELECT COUNT(*) FROM users WHERE dept_id = d.id AND is_active = 1) as user_count FROM departments d ORDER BY d.name'
    );
    res.json(depts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/users', async (req, res) => {
  try {
    const { dept_id, query } = req.query;
    let sql =       'SELECT u.id, u.name, u.email, u.role, u.avatar, u.phone, u.dept_id, d.name as dept_name FROM users u LEFT JOIN departments d ON u.dept_id = d.id WHERE u.is_active = 1';
    const params = [];
    if (dept_id) { sql += ' AND u.dept_id = ?'; params.push(Number(dept_id)); }
    if (query) { sql += ' AND (u.name LIKE ? OR u.email LIKE ?)'; params.push(`%${query}%`, `%${query}%`); }
    sql += ' ORDER BY u.name';
    const [users] = await pool.query(sql, params);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/users/:id', async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT u.id, u.name, u.email, u.role, u.avatar, u.phone, u.dept_id, d.name as dept_name FROM users u LEFT JOIN departments d ON u.dept_id = d.id WHERE u.id = ?',
      [req.params.id]
    );
    if (!users.length) return res.status(404).json({ error: 'User not found' });
    res.json(users[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const [[userCount]] = await pool.query('SELECT COUNT(*) as total FROM users WHERE is_active = 1');
    const [[taskCount]] = await pool.query('SELECT COUNT(*) as total FROM tasks');
    const [[chatCount]] = await pool.query('SELECT COUNT(*) as total FROM chats');
    const [[deptCount]] = await pool.query('SELECT COUNT(*) as total FROM departments');
    res.json({ users: userCount.total, tasks: taskCount.total, chats: chatCount.total, departments: deptCount.total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
