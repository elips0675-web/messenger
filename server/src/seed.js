import bcrypt from 'bcryptjs';
import pool from './db.js';

async function seed() {
  // Departments
  await pool.query(`INSERT INTO departments (name, head) VALUES
    ('Руководство', 'Алексей Волков'),
    ('IT-отдел', 'Дмитрий Козлов'),
    ('Бухгалтерия', 'Елена Соколова'),
    ('HR', 'Анна Белова')
  ON DUPLICATE KEY UPDATE name=VALUES(name)`);

  // Users
  const hash = await bcrypt.hash('password123', 10);
  const users = [
    ['Алексей Волков', 'ceo@company.ru', hash, 'CEO', 'AV', '+7 (999) 111-22-33', 1],
    ['Дмитрий Козлов', 'it@company.ru', hash, 'IT Director', 'DK', '+7 (999) 222-33-44', 2],
    ['Иван Петров', 'dev1@company.ru', hash, 'Senior Dev', 'IP', '+7 (999) 333-44-55', 2],
    ['Елена Соколова', 'buh@company.ru', hash, 'Head Acc.', 'ES', '+7 (999) 444-55-66', 3],
    ['Анна Белова', 'hr@company.ru', hash, 'HR Manager', 'AB', '+7 (999) 555-66-77', 4],
    ['Мария Смирнова', 'dev2@company.ru', hash, 'Junior Dev', 'MS', '+7 (999) 666-77-88', 2],
  ];
  for (const u of users) {
    await pool.query(
      `INSERT INTO users (name, email, password, role, avatar, phone, dept_id)
       VALUES (?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE name=VALUES(name)`,
      u
    );
  }

  // Chats
  await pool.query(`INSERT INTO chats (id, name, type, avatar) VALUES
    (1, 'Общий чат', 'group', '🏢'),
    (2, 'IT-команда', 'group', '💻'),
    (3, 'Срочное', 'group', '⚡')
  ON DUPLICATE KEY UPDATE name=VALUES(name)`);

  await pool.query(`INSERT IGNORE INTO chat_members (chat_id, user_id) VALUES
    (1,1),(1,2),(1,3),(1,4),(1,5),(1,6),
    (2,2),(2,3),(2,6),
    (3,1),(3,2),(3,4)`);

  await pool.query(`INSERT IGNORE INTO messages (chat_id, user_id, text, created_at) VALUES
    (1,2,'Коллеги, сегодня релиз в 18:00','2026-06-29 09:30:00'),
    (1,5,'Принято, готовим документы','2026-06-29 09:35:00'),
    (1,3,'Всем привет! Новый билд на тестовом сервере','2026-06-29 10:42:00'),
    (2,3,'Дим, глянь пулл-реквест','2026-06-29 11:15:00'),
    (2,2,'Ок, сейчас посмотрю','2026-06-29 11:18:00'),
    (2,6,'Я проверила, всё ок','2026-06-29 11:22:00'),
    (3,1,'Срочно нужен отчёт по проекту!','2026-06-28 17:00:00'),
    (3,4,'Готовлю, будет через час','2026-06-28 17:05:00'),
    (3,1,'Жду.','2026-06-28 17:06:00')`);

  // Tasks
  await pool.query(`INSERT IGNORE INTO tasks (id, title, description, status, priority, assignee_id, creator_id, dept_id, deadline) VALUES
    (1, 'Разработать API чатов', 'Разработать REST API для чатов с поддержкой WebSocket.', 'done', 'high', 3, 2, 2, '2026-07-01'),
    (2, 'Внедрить систему уведомлений', 'Email и push-уведомления для задач и сообщений.', 'progress', 'high', 6, 2, 2, '2026-07-15'),
    (3, 'Сверка квартальных отчётов', 'Подготовить отчёт по расходам и доходам за Q2.', 'progress', 'medium', 4, 1, 3, '2026-07-10'),
    (4, 'Наём фронтенд-разработчика', 'Провести собеседования, найти senior React-разработчика.', 'progress', 'medium', 5, 1, 4, '2026-07-31'),
    (5, 'Рефакторинг модуля авторизации', 'Переписать auth-модуль на JWT с refresh-токенами.', 'todo', 'low', 6, 3, 2, '2026-08-01')`);

  await pool.query(`INSERT IGNORE INTO subtasks (task_id, title, done) VALUES
    (1, 'Спроектировать схему БД', TRUE),
    (1, 'Написать CRUD для сообщений', TRUE),
    (1, 'Подключить Socket.IO', TRUE),
    (2, 'Настроить очередь задач', TRUE),
    (2, 'Интеграция с SMTP', FALSE),
    (2, 'WebSocket уведомления', FALSE),
    (4, 'Разместить вакансию', TRUE),
    (4, 'Отобрать резюме', TRUE),
    (4, 'Провести тех. собеседование', FALSE)`);

  // Notifications
  await pool.query(`INSERT IGNORE INTO notifications (user_id, text, type) VALUES
    (1, 'Иван Петров завершил задачу "Разработать API чатов"', 'task'),
    (3, 'Дмитрий Козлов упомянул вас в IT-команде', 'mention'),
    (4, 'Срок задачи "Сверка отчётов" истекает через 3 дня', 'deadline'),
    (1, 'HR приглашает на корпоратив в пятницу', 'event'),
    (6, 'Новый сотрудник присоединился к компании', 'system')`);

  console.log('Seed data inserted successfully!');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
