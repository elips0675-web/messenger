import jwt from 'jsonwebtoken';
import pool from './db.js';

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET not set in environment. Create server/.env with JWT_SECRET=your-secret');
  process.exit(1);
}
const JWT_SECRET = process.env.JWT_SECRET;

export function generateToken(user) {
  return jwt.sign({ userId: user.id, email: user.email, role: user.role || 'user' }, JWT_SECRET, { expiresIn: '24h' });
}

export function generateRefreshToken(user) {
  return jwt.sign({ userId: user.id, type: 'refresh' }, JWT_SECRET + '-refresh', { expiresIn: '30d' });
}

export function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    req.userId = decoded.userId;
    req.user = { id: decoded.userId, email: decoded.email, role: decoded.role };
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.userId = null;
    return next();
  }
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    req.userId = decoded.userId;
    req.user = { id: decoded.userId, email: decoded.email, role: decoded.role };
  } catch {
    req.userId = null;
  }
  next();
}

export async function adminAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Admin authentication required' });
  }
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    const [rows] = await pool.query('SELECT id, name, email, role FROM users WHERE id = ? AND role = ? AND is_active = 1', [decoded.userId, 'admin']);
    if (rows.length === 0) return res.status(403).json({ message: 'Admin access required' });
    req.userId = decoded.userId;
    req.user = rows[0];
    req.admin = rows[0];
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

export { JWT_SECRET };
