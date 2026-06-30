import { Router } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../../db.js';
import crypto from 'crypto';

const router = Router();

router.get('/me', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name, email, role, avatar, phone FROM users WHERE id = ?', [req.admin.id]);
    if (!rows.length) return res.status(404).json({ message: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    req.log?.error('Admin me error', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/users', async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT u.id, u.name, u.email, u.role, u.avatar, u.phone, u.dept_id, u.is_active, d.name as dept_name FROM users u LEFT JOIN departments d ON u.dept_id = d.id ORDER BY u.name'
    );
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/users', async (req, res) => {
  try {
    const { name, email, password, role, phone, dept_id } = req.body;
    const hash = await bcrypt.hash(password || 'password123', 10);
    const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, role, avatar, phone, dept_id, is_active) VALUES (?,?,?,?,?,?,?,1)',
      [name, email, hash, role || 'user', initials, phone || '', dept_id || null]
    );
    const [[user]] = await pool.query('SELECT id, name, email, role FROM users WHERE id = ?', [result.insertId]);
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/users/:id', async (req, res) => {
  try {
    const fields = ['name', 'email', 'role', 'phone', 'dept_id', 'is_active'];
    const sets = fields.filter(f => req.body[f] !== undefined).map(f => `${f} = ?`);
    const vals = fields.filter(f => req.body[f] !== undefined).map(f => req.body[f]);
    if (req.body.password) {
      const hash = await bcrypt.hash(req.body.password, 10);
      sets.push('password = ?');
      vals.push(hash);
    }
    if (!sets.length) return res.status(400).json({ error: 'No fields' });
    await pool.query(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, [...vals, req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/departments', async (req, res) => {
  try {
    const [depts] = await pool.query('SELECT d.*, (SELECT COUNT(*) FROM users WHERE dept_id = d.id) as user_count FROM departments d ORDER BY d.name');
    res.json(depts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/departments', async (req, res) => {
  try {
    const { name, head } = req.body;
    const [result] = await pool.query('INSERT INTO departments (name, head) VALUES (?,?)', [name, head || '']);
    const [[dept]] = await pool.query('SELECT * FROM departments WHERE id = ?', [result.insertId]);
    res.status(201).json(dept);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/departments/:id', async (req, res) => {
  try {
    const { name, head } = req.body;
    await pool.query('UPDATE departments SET name = COALESCE(?, name), head = COALESCE(?, head) WHERE id = ?', [name, head, req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/departments/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM departments WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/campaigns', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, title, body, target, channel, status, DATE_FORMAT(created_at, '%Y-%m-%d') as sentAt, delivered, opened, clicked
       FROM campaigns ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/campaigns', async (req, res) => {
  try {
    const { title, body, target, channel } = req.body;
    if (!title || !body) return res.status(400).json({ message: 'Title and body required' });
    const [result] = await pool.query(
      'INSERT INTO campaigns (title, body, target, channel, admin_id) VALUES (?,?,?,?,?)',
      [title, body, target || 'all', channel || 'push', req.admin.id]
    );
    res.status(201).json({ id: result.insertId, message: 'Campaign sent' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/webhooks', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM webhooks ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/webhooks', async (req, res) => {
  try {
    const { name, type, url } = req.body;
    const token = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
    const [result] = await pool.query(
      'INSERT INTO webhooks (name, type, url, token, active) VALUES (?,?,?,?,1)',
      [name, type || 'incoming', url || '', token]
    );
    const [[hook]] = await pool.query('SELECT * FROM webhooks WHERE id = ?', [result.insertId]);
    res.status(201).json(hook);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/webhooks/:id', async (req, res) => {
  try {
    await pool.query('UPDATE webhooks SET active = ? WHERE id = ?', [req.body.active ? 1 : 0, req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/webhooks/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM webhooks WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/bots', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM bots ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/bots', async (req, res) => {
  try {
    const { name, avatar, desc, webhookUrl, systemPrompt } = req.body;
    const token = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
    const [result] = await pool.query(
      'INSERT INTO bots (name, avatar, description, webhook_url, system_prompt, token, active) VALUES (?,?,?,?,?,?,1)',
      [name, avatar || '🤖', desc || '', webhookUrl || '', systemPrompt || '', token]
    );
    const [[bot]] = await pool.query('SELECT * FROM bots WHERE id = ?', [result.insertId]);
    res.status(201).json(bot);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/bots/:id', async (req, res) => {
  try {
    await pool.query('UPDATE bots SET active = ? WHERE id = ?', [req.body.active ? 1 : 0, req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/bots/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM bots WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/retention', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM retention_rules ORDER BY id');
    if (!rows.length) {
      return res.json([
        { id: 1, type: 'messages', label: 'Сообщения', days: 365, active: true },
        { id: 2, type: 'files', label: 'Файлы', days: 730, active: true },
        { id: 3, type: 'notifications', label: 'Уведомления', days: 90, active: true },
        { id: 4, type: 'audit', label: 'Логи аудита', days: 1095, active: true },
      ]);
    }
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/retention/:id', async (req, res) => {
  try {
    await pool.query(
      'INSERT INTO retention_rules (id, type, label, days, active) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE days = VALUES(days), active = VALUES(active)',
      [req.params.id, req.body.type || '', req.body.label || '', req.body.days || 365, req.body.active ? 1 : 0]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/audit-log', async (req, res) => {
  try {
    let sql = `SELECT al.*, u.name as user_name FROM audit_log al LEFT JOIN users u ON al.user_id = u.id`;
    const params = [];
    if (req.query.type && req.query.type !== 'all') {
      sql += ' WHERE al.type = ?';
      params.push(req.query.type);
    }
    sql += ' ORDER BY al.created_at DESC LIMIT 200';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
