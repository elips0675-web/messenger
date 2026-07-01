import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DB_PATH || (process.env.VERCEL ? '/tmp/corp_messenger.db' : path.join(process.cwd(), 'data', 'corp_messenger.db'));

const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const isNew = !fs.existsSync(DB_PATH);
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function sqliteType(sql) {
  return sql
    .replace(/ENGINE\s*=\s*\S+/gi, '')
    .replace(/DEFAULT\s+CHARSET\s*=\s*\S+/gi, '')
    .replace(/COLLATE\s*=\s*\S+/gi, '')
    .replace(/AUTO_INCREMENT/gi, 'AUTOINCREMENT')
    .replace(/\bint\b(?!\s*EGER)/gi, 'INTEGER')
    .replace(/\btinyint\s*\(.*?\)/gi, 'INTEGER')
    .replace(/\BBOOLEAN\b/gi, 'INTEGER')
    .replace(/\bENUM\s*\(.*?\)/gi, 'TEXT')
    .replace(/\bJSON\b/gi, 'TEXT')
    .replace(/longtext/gi, 'TEXT')
    .replace(/varchar\s*\(.*?\)/gi, 'TEXT')
    .replace(/timestamp\s*(NULL|NOT NULL)?\s*DEFAULT\s+CURRENT_TIMESTAMP(?!\s*ON)/gi, "TEXT DEFAULT (datetime('now'))")
    .replace(/ON UPDATE CURRENT_TIMESTAMP/gi, '')
    .replace(/`/g, '"')
    .replace(/KEY\s+\S+\s*\(/g, '');
}

const SCHEMA = sqliteType(`
CREATE TABLE IF NOT EXISTS departments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  head TEXT
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  title TEXT DEFAULT 'Сотрудник',
  avatar TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  dept_id INTEGER,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  totp_secret TEXT,
  totp_enabled INTEGER DEFAULT 0,
  FOREIGN KEY (dept_id) REFERENCES departments(id)
);

CREATE TABLE IF NOT EXISTS chats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'group',
  avatar TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS chat_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chat_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  last_read_at TEXT,
  FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(chat_id, user_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chat_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  text TEXT NOT NULL,
  image_url TEXT,
  reply_to INTEGER,
  edited INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reply_to) REFERENCES messages(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS message_reactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  emoji TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(message_id, user_id, emoji)
);

CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'todo',
  priority TEXT DEFAULT 'medium',
  assignee_id INTEGER,
  creator_id INTEGER,
  dept_id INTEGER,
  deadline TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (assignee_id) REFERENCES users(id),
  FOREIGN KEY (creator_id) REFERENCES users(id),
  FOREIGN KEY (dept_id) REFERENCES departments(id)
);

CREATE TABLE IF NOT EXISTS subtasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  done INTEGER DEFAULT 0,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS task_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  size TEXT,
  type TEXT,
  data TEXT,
  user_id INTEGER,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS task_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  text TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS task_activity (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  action TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '📁',
  status TEXT DEFAULT 'active',
  lead_id INTEGER,
  dept_id INTEGER,
  deadline TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (lead_id) REFERENCES users(id),
  FOREIGN KEY (dept_id) REFERENCES departments(id)
);

CREATE TABLE IF NOT EXISTS project_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(project_id, user_id)
);

CREATE TABLE IF NOT EXISTS project_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  size TEXT,
  type TEXT,
  data TEXT,
  user_id INTEGER,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS project_wiki (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL UNIQUE,
  content TEXT,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  text TEXT NOT NULL,
  type TEXT DEFAULT 'system',
  readed INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, endpoint)
);

CREATE TABLE IF NOT EXISTS content_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content TEXT,
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  target TEXT DEFAULT 'all',
  channel TEXT DEFAULT 'push',
  admin_id INTEGER,
  status TEXT DEFAULT 'sent',
  delivered INTEGER DEFAULT 0,
  opened INTEGER DEFAULT 0,
  clicked INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (admin_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS file_folders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  parent_id INTEGER,
  user_id INTEGER NOT NULL,
  is_shared INTEGER DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  size TEXT,
  type TEXT,
  data TEXT,
  folder_id INTEGER,
  user_id INTEGER NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (folder_id) REFERENCES file_folders(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT,
  description TEXT,
  creator_id INTEGER,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (creator_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS channels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'open',
  owner_id INTEGER,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (owner_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS channel_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(channel_id, user_id)
);

CREATE TABLE IF NOT EXISTS kanban_state (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  state TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS gantt_state (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  state TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS timeline_state (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  state TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mindmaps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT DEFAULT 'Новая карта',
  nodes TEXT,
  links TEXT,
  user_id INTEGER NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS webhooks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'incoming',
  url TEXT DEFAULT '',
  token TEXT,
  active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS bots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  avatar TEXT DEFAULT '🤖',
  description TEXT,
  webhook_url TEXT,
  system_prompt TEXT,
  token TEXT,
  active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS retention_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  label TEXT,
  days INTEGER DEFAULT 365,
  active INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action TEXT,
  type TEXT DEFAULT 'system',
  target TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  text TEXT NOT NULL,
  image_url TEXT,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS post_likes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(post_id, user_id)
);

CREATE TABLE IF NOT EXISTS post_comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  text TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS wiki_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '📂'
);

CREATE TABLE IF NOT EXISTS wiki_articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT,
  category_id INTEGER,
  author_id INTEGER NOT NULL,
  status TEXT DEFAULT 'published',
  views INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (category_id) REFERENCES wiki_categories(id) ON DELETE SET NULL,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS workflows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '📋',
  created_by INTEGER NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS workflow_stages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workflow_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  step_order INTEGER DEFAULT 0,
  approver_id INTEGER NOT NULL,
  FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE,
  FOREIGN KEY (approver_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS workflow_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workflow_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  requester_id INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  current_stage INTEGER,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE,
  FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS workflow_approvals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id INTEGER NOT NULL,
  stage_id INTEGER NOT NULL,
  approver_id INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  comment TEXT,
  decided_at TEXT,
  FOREIGN KEY (request_id) REFERENCES workflow_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (stage_id) REFERENCES workflow_stages(id) ON DELETE CASCADE,
  FOREIGN KEY (approver_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  cover TEXT DEFAULT '📚',
  author_id INTEGER NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS course_lessons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  order_index INTEGER DEFAULT 0,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS quiz_questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL,
  question TEXT NOT NULL,
  options TEXT NOT NULL,
  correct_index INTEGER NOT NULL,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  answer_index INTEGER NOT NULL,
  correct INTEGER DEFAULT 0,
  attempted_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (question_id) REFERENCES quiz_questions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS course_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  completed_lessons INTEGER DEFAULT 0,
  total_lessons INTEGER DEFAULT 0,
  quiz_score INTEGER DEFAULT 0,
  completed INTEGER DEFAULT 0,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(course_id, user_id)
);

CREATE TABLE IF NOT EXISTS telegram_bot (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT NOT NULL UNIQUE,
  webhook_url TEXT,
  active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'open',
  priority TEXT DEFAULT 'medium',
  channel TEXT DEFAULT 'telegram',
  telegram_chat_id TEXT,
  assigned_to INTEGER,
  created_by INTEGER,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (assigned_to) REFERENCES users(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS ticket_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id INTEGER NOT NULL,
  user_id INTEGER,
  text TEXT NOT NULL,
  channel TEXT DEFAULT 'telegram',
  is_internal INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS polls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  multiple_choice INTEGER DEFAULT 0,
  anonymous INTEGER DEFAULT 0,
  created_by INTEGER NOT NULL,
  expires_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS poll_options (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  poll_id INTEGER NOT NULL,
  text TEXT NOT NULL,
  votes_count INTEGER DEFAULT 0,
  FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS poll_votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  poll_id INTEGER NOT NULL,
  option_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE,
  FOREIGN KEY (option_id) REFERENCES poll_options(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(poll_id, option_id, user_id)
);
`);

const SEED = `
INSERT OR IGNORE INTO departments (id, name) VALUES (1, 'Руководство'), (2, 'IT-отдел'), (3, 'HR-отдел'), (4, 'Бухгалтерия'), (5, 'Отдел продаж'), (6, 'Маркетинг');
INSERT OR IGNORE INTO users (id, name, email, password, role, title, avatar, dept_id, is_active) VALUES
  (1, 'Алексей Смирнов', 'ceo@company.ru', '$2a$10$3QS.NNK1AT/ek1XTPXAWaes0RJR.jPAncvnEI78cy8bhIdPYnQpP2', 'admin', 'Генеральный директор', 'AC', 1, 1),
  (2, 'Мария Иванова', 'it@company.ru', '$2a$10$3QS.NNK1AT/ek1XTPXAWaes0RJR.jPAncvnEI78cy8bhIdPYnQpP2', 'manager', 'Tech Lead', 'MI', 2, 1),
  (3, 'Дмитрий Козлов', 'dev1@company.ru', '$2a$10$3QS.NNK1AT/ek1XTPXAWaes0RJR.jPAncvnEI78cy8bhIdPYnQpP2', 'user', 'Senior Developer', 'DK', 2, 1),
  (4, 'Елена Петрова', 'hr@company.ru', '$2a$10$3QS.NNK1AT/ek1XTPXAWaes0RJR.jPAncvnEI78cy8bhIdPYnQpP2', 'manager', 'HR Director', 'EP', 3, 1),
  (5, 'Иван Морозов', 'manager@company.ru', '$2a$10$3QS.NNK1AT/ek1XTPXAWaes0RJR.jPAncvnEI78cy8bhIdPYnQpP2', 'user', 'Project Manager', 'IM', 5, 1),
  (6, 'Анна Соколова', 'dev2@company.ru', '$2a$10$3QS.NNK1AT/ek1XTPXAWaes0RJR.jPAncvnEI78cy8bhIdPYnQpP2', 'user', 'Junior Developer', 'AS', 2, 1);
INSERT OR IGNORE INTO chats (id, name, type) VALUES (1, 'IT-отдел', 'group'), (2, 'HR-отдел', 'group'), (3, 'Общий чат', 'group');
INSERT OR IGNORE INTO chat_members (chat_id, user_id, last_read_at) VALUES
  (1,1,'2026-07-01T10:00:00'),(1,2,'2026-07-01T10:00:00'),(1,3,'2026-07-01T10:00:00'),(1,5,'2026-07-01T10:00:00'),(1,6,'2026-07-01T10:00:00'),
  (2,1,'2026-07-01T10:00:00'),(2,4,'2026-07-01T10:00:00'),
  (3,1,'2026-07-01T10:00:00'),(3,2,'2026-07-01T10:00:00'),(3,3,'2026-07-01T10:00:00'),(3,4,'2026-07-01T10:00:00'),(3,5,'2026-07-01T10:00:00'),(3,6,'2026-07-01T10:00:00');
INSERT OR IGNORE INTO messages (chat_id, user_id, text, created_at) VALUES
  (1,2,'Привет, коллеги! Новая версия готова к деплою', '2026-07-01T08:00:00'),
  (1,3,'Отлично, заливаю на прод', '2026-07-01T08:05:00'),
  (2,4,'Всем привет! Напоминаю о планерке в 11:00', '2026-07-01T09:00:00'),
  (3,1,'Доброе утро, команда!', '2026-07-01T07:30:00');
`;

function transformSQL(sql) {
  return sql
    .replace(/`/g, '"')
    .replace(/\bNOW\(\)/gi, "datetime('now')")
    .replace(/\bCOALESCE\(/gi, 'IFNULL(')
    .replace(/DATE_FORMAT\((\w+),\s*["']([^"']+)["']\)/gi, (match, col, fmt) => {
      const m = { '%Y': '%Y', '%m': '%m', '%d': '%d', '%H': '%H', '%i': '%M', '%s': '%S' };
      return `strftime('${fmt.replace(/%[YmdHMs]/gi, c => m[c.toLowerCase()] || c)}', ${col})`;
    })
    .replace(/ON DUPLICATE KEY UPDATE/gi, 'ON CONFLICT(id) DO UPDATE SET');
}

const pool = {
  async query(sql, params) {
    const t = transformSQL(sql);
    const stmt = db.prepare(t);
    try {
      if (/^SELECT/i.test(t) || /^WITH/i.test(t)) {
        const rows = params ? stmt.all(...params) : stmt.all();
        return [rows];
      }
      const info = params ? stmt.run(...params) : stmt.run();
      if (/INSERT/i.test(t)) return [{ insertId: info.lastInsertRowid }];
      if (/UPDATE|DELETE/i.test(t)) return [{ affectedRows: info.changes }];
      return [{}];
    } catch (err) {
      throw new Error(`${err.message} (SQL: ${t.slice(0, 200)})`);
    }
  },

  async getConnection() {
    return new SQLiteConnection(db);
  },
};

class SQLiteConnection {
  constructor(db) {
    this.db = db;
  }
  async query(sql, params) {
    return pool.query(sql, params);
  }
  async beginTransaction() {
    this.db.exec('BEGIN TRANSACTION');
  }
  async commit() {
    this.db.exec('COMMIT');
  }
  async rollback() {
    this.db.exec('ROLLBACK');
  }
  release() {}
}

// Init schema + seed on first run
if (isNew) {
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  db.exec(SCHEMA);
  db.exec(SEED);
  // Create indexes
  db.exec(`CREATE INDEX IF NOT EXISTS idx_messages_chat ON messages(chat_id, created_at);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id, created_at);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_tasks_creator ON tasks(creator_id);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_post_com_post ON post_comments(post_id, created_at);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_wiki_articles_cat ON wiki_articles(category_id);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_workflow_requests_req ON workflow_requests(requester_id);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_workflow_approvals_req ON workflow_approvals(request_id);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_course_progress_cu ON course_progress(course_id, user_id);`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_tickets_telegram ON tickets(telegram_chat_id);`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket ON ticket_messages(ticket_id, created_at);`);
}

export default pool;
