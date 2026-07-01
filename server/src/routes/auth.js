import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import pool from '../db.js';
import { generateToken, generateRefreshToken, JWT_SECRET } from '../middleware.js';

const REFRESH_SECRET = JWT_SECRET + '-refresh';

const router = Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password, totpCode } = req.body;
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) return res.status(401).json({ error: 'Неверный email или пароль' });
    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Неверный email или пароль' });

    // Check 2FA
    if (user.totp_enabled) {
      if (!totpCode) {
        return res.json({ require2fa: true, tempToken: jwt.sign({ id: user.id, step: '2fa' }, JWT_SECRET, { expiresIn: '5m' }) });
      }
      const verified = speakeasy.totp.verify({ secret: user.totp_secret, encoding: 'base32', token: totpCode, window: 1 });
      if (!verified) return res.status(401).json({ error: 'Неверный код' });
    }

    const token = generateToken(user);
    const refresh_token = generateRefreshToken(user);
    res.json({ token, refresh_token, user: { id: user.id, name: user.name, email: user.email, role: user.role || 'user', title: user.title || user.role, avatar: user.avatar, phone: user.phone, dept_id: user.dept_id } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, dept_id, title } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Имя, email и пароль обязательны' });
    }
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Пользователь с таким email уже существует' });
    }
    const hash = await bcrypt.hash(password, 10);
    const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, role, avatar, dept_id, title, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
      [name, email, hash, 'user', initials, dept_id || null, title || 'Сотрудник'],
    );
    const userData = { id: result.insertId, email };
    const token = generateToken(userData);
    const refresh_token = generateRefreshToken(userData);
    res.status(201).json({
      token, refresh_token,
      user: { id: result.insertId, name, email, role: 'user', avatar: initials },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token' });
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    const [rows] = await pool.query(
      'SELECT u.*, d.name as dept_name FROM users u LEFT JOIN departments d ON u.dept_id = d.id WHERE u.id = ?',
      [decoded.userId || decoded.id],
    );
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    const { password, totp_secret, ...u } = rows[0];
    res.json({ ...u, totp_enabled: !!u.totp_enabled });
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

router.get('/departments', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name FROM departments');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/refresh', async (req, res) => {
  const { refresh_token } = req.body;
  if (!refresh_token) return res.status(400).json({ error: 'Refresh token required' });
  try {
    const decoded = jwt.verify(refresh_token, REFRESH_SECRET);
    if (decoded.type !== 'refresh') return res.status(401).json({ error: 'Invalid token type' });
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ? AND is_active = 1', [decoded.id]);
    if (rows.length === 0) return res.status(401).json({ error: 'User not found' });
    const user = rows[0];
    const token = generateToken(user);
    const new_refresh_token = generateRefreshToken(user);
    res.json({ token, refresh_token: new_refresh_token });
  } catch {
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

// --- 2FA routes ---

function getUserId(req) {
  const auth = req.headers.authorization;
  if (!auth) return null;
  try { const d = jwt.verify(auth.split(' ')[1], JWT_SECRET); return d.userId || d.id; } catch { return null; }
}

router.post('/2fa/setup', async (req, res) => {
  const id = getUserId(req);
  if (!id) return res.status(401).json({ error: 'Auth required' });
  const secret = speakeasy.generateSecret({ name: 'CorpMessenger:' + req.body.email || 'user' });
  const qrUrl = await qrcode.toDataURL(secret.otpauth_url);
  res.json({ secret: secret.base32, qrUrl });
});

router.post('/2fa/verify', async (req, res) => {
  const id = getUserId(req);
  if (!id) return res.status(401).json({ error: 'Auth required' });
  const { code, secret } = req.body;
  const verified = speakeasy.totp.verify({ secret, encoding: 'base32', token: code, window: 1 });
  if (!verified) return res.status(400).json({ error: 'Неверный код' });
  await pool.query('UPDATE users SET totp_secret = ?, totp_enabled = 1 WHERE id = ?', [secret, id]);
  res.json({ enabled: true });
});

router.post('/2fa/disable', async (req, res) => {
  const id = getUserId(req);
  if (!id) return res.status(401).json({ error: 'Auth required' });
  const { code } = req.body;
  const [rows] = await pool.query('SELECT totp_secret FROM users WHERE id = ?', [id]);
  if (!rows[0]?.totp_secret) return res.status(400).json({ error: '2FA не настроена' });
  const verified = speakeasy.totp.verify({ secret: rows[0].totp_secret, encoding: 'base32', token: code, window: 1 });
  if (!verified) return res.status(400).json({ error: 'Неверный код' });
  await pool.query('UPDATE users SET totp_secret = NULL, totp_enabled = 0 WHERE id = ?', [id]);
  res.json({ enabled: false });
});

router.get('/2fa/status', async (req, res) => {
  const id = getUserId(req);
  if (!id) return res.status(401).json({ error: 'Auth required' });
  const [rows] = await pool.query('SELECT totp_enabled FROM users WHERE id = ?', [id]);
  res.json({ enabled: !!rows[0]?.totp_enabled });
});

export default router;
