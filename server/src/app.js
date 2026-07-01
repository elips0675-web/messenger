import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import { auth, adminAuth, asyncHandler } from './middleware.js';
import { createLogger, rootLogger } from './logger.js';
import pool from './db.js';

import authRoutes from './routes/auth.js';
import chatRoutes from './routes/chats.js';
import taskRoutes from './routes/tasks.js';
import projectRoutes from './routes/projects.js';
import fileRoutes from './routes/files.js';
import notificationRoutes from './routes/notifications.js';
import calendarRoutes from './routes/calendar.js';
import channelRoutes from './routes/channels.js';
import kanbanRoutes from './routes/kanban.js';
import ganttRoutes from './routes/gantt.js';
import timelineRoutes from './routes/timeline.js';
import mindmapRoutes from './routes/mindmap.js';
import searchRoutes from './routes/search.js';
import corpRoutes from './routes/corporate.js';
import pushRoutes from './routes/push.js';
import adminRoutes from './routes/admin/index.js';
import feedRoutes from './routes/feed.js';
import wikiRoutes from './routes/wiki.js';
import workflowRoutes from './routes/workflows.js';
import courseRoutes from './routes/courses.js';
import pollRoutes from './routes/polls.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

const limiter = rateLimit({ windowMs: 60_000, max: 200, message: { message: 'Too many requests' } });
const authLimiter = rateLimit({ windowMs: 60_000, max: 20, message: { message: 'Too many auth attempts' } });

app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(helmet({ contentSecurityPolicy: false }));

app.use((req, res, next) => {
  req.rid = req.headers['x-request-id'] || crypto.randomUUID();
  res.setHeader('X-Request-Id', req.rid);
  req.log = createLogger(req.rid);
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/api/', limiter);
app.use('/api/auth/', authLimiter);

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString(), rid: req.rid }));

app.use('/api/auth', authRoutes);

app.use(['/api/push', '/api/chats', '/api/tasks', '/api/projects', '/api/files',
  '/api/notifications', '/api/calendar', '/api/channels', '/api/kanban',
  '/api/gantt', '/api/timeline', '/api/mindmap', '/api/search', '/api/corporate',
  '/api/feed', '/api/wiki', '/api/workflows', '/api/courses', '/api/polls'], auth);

app.use('/api', pushRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/kanban', kanbanRoutes);
app.use('/api/gantt', ganttRoutes);
app.use('/api/timeline', timelineRoutes);
app.use('/api/mindmap', mindmapRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/corporate', corpRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/wiki', wikiRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/polls', pollRoutes);

app.use('/api/admin', adminAuth, adminRoutes);

app.use((err, req, res, next) => {
  const log = req.log || rootLogger;
  log.error('Unhandled error', err);
  res.status(500).json({ message: 'Internal server error' });
});

export default app;
