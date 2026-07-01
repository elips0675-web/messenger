## Goal
Развернуть корпоративный мессенджер (Bitrix24-like) на Vercel — фронтенд + Express-бэкенд как serverless-функция, с возможностью работы на SQLite для демо.

## Constraints & Preferences
- Бэкенд: Express + Socket.IO, порт 3001 (локально), MySQL 8.4 / SQLite (Vercel)
- Фронтенд: React 19 + Vite 6, порт 3000, base `/messenger-app/` локально, `/` на Vercel
- Репозиторий: `https://github.com/elips0675-web/messenger`
- Vercel проект: `vadims-projects-74cb21aa/messenger`
- Ответы и код на русском

## Progress
### Done
- **SQLite для демо на Vercel:**
  - `server/src/db-sqlite.js` — адаптер `better-sqlite3` с полной схемой (52 таблицы) и сид-данными
  - 6 пользователей, 3 чата, сообщения — все как в MySQL
  - Добавлены таблицы: `telegram_bot`, `tickets`, `ticket_messages` для Telegram-интеграции
  - `server/src/db.js` — выбор: `DB_TYPE=sqlite` → SQLite, иначе MySQL
  - `DB_PATH = /tmp/corp_messenger.db` на Vercel (writable filesystem)
  - `data/` в `.gitignore`
- **Telegram интеграция:**
  - `server/src/routes/telegram.js` — вебхук, создание тикетов, ответы через Telegram Bot API
  - Роут `/api/telegram` подключён в `app.js`
  - Протестировано: регистрация бота, создание тикета через Telegram
- **Оптимизация бэкенда:**
  - 15+ индексов БД: `messages(chat_id,created_at)`, `notifications(user_id,created_at)`, `tasks(assignee_id,status)`, `wiki_articles(category_id,status)`, `posts(created_at)` и др.
  - `asyncHandler(fn)` в `middleware.js` — ~300 строк try/catch убраны из 21 роут-файла
  - `database/alter-indexes.sql` — миграция для существующей БД
- **README.md** — полное описание проекта, быстрый старт, архитектура
- **Vercel деплой:**
  - `vercel.json` — SPA rewrites, `buildCommand: BASE_URL=/ npm run build`
  - `vite.config.js` — `base: process.env.BASE_URL || '/messenger-app/'`
  - `server/src/app.js` — Express app без HTTP-сервера/Socket.IO/PeerJS
  - `server/src/index.js` — только HTTP-сервер + Socket.IO + PeerJS (локально)
  - `api/index.js` — Vercel serverless-функция с `app.js`
  - `VITE_API_URL` — env-переменная для API-запросов на Vercel
- Все изменения закоммичены и запушины в GitHub

### In Progress
- (none)

### Blocked
- Настройка env-переменных на Vercel (JWT_SECRET, DB_TYPE=sqlite) — нужно сделать вручную

## Key Decisions
- `app.js` отделён от `index.js` — Express как serverless на Vercel
- `DB_TYPE=sqlite` — SQLite вместо MySQL в демо-режиме (не нужна облачная БД)
- SQLite адаптер: `query()` возвращает `[rows]` / `[{insertId}]` / `[{affectedRows}]` — совместимо с `mysql2/promise`
- `data/` в `.gitignore` — чтобы SQLite-файлы не попадали в репозиторий
- AsyncHandler — централизованная обработка ошибок вместо try/catch в каждом роуте

## Next Steps
1. Зайти в Vercel → Settings → Environment Variables → добавить `JWT_SECRET`, `DB_TYPE=sqlite`
2. Перезапустить деплой на Vercel
3. Проверить работу эндпоинтов после деплоя

## Critical Context
- Бэкенд стабильно отвечает через SQLite (проверено: логин, чаты, задачи, Telegram)
- Локально: фронт `localhost:3000/messenger-app/`, бэк `localhost:3001`
- Vercel: `messenger-git-master-...vercel.app`
- Логин для теста: `ceo@company.ru` / `password123` (роль admin, 6 пользователей)
- SQLite создаётся с нуля при первом запросе после деплоя (неперсистентный `/tmp`)
- Репозиторий подключён к Vercel — каждый пуш в master триггерит деплой

## Relevant Files
- **`server/src/db-sqlite.js`** — SQLite адаптер: 52 таблицы, сид, индексы, `query()`-прокси
- **`server/src/db.js`** — выбор MySQL или SQLite через `DB_TYPE`
- **`server/src/app.js`** — Express app, все роуты (+ Telegram), middleware, error handler
- **`server/src/index.js`** — HTTP-сервер + Socket.IO + PeerJS (локально)
- **`server/src/routes/telegram.js`** — Telegram Bot API интеграция (вебхук, тикеты, ответы)
- **`api/index.js`** — Vercel serverless-функция
- **`server/src/middleware.js`** — `asyncHandler(fn)`, `auth`, `adminAuth`, `JWT_SECRET`
- **`vercel.json`** — Vercel-конфиг, SPA rewrites
- **`vite.config.js`** — `base` через `BASE_URL`
- **`src/lib/api.js`** — `baseUrl` через `VITE_API_URL`
- **`server/src/routes/`** — 22 роут-файла, все через `asyncHandler`
- **`database/alter-indexes.sql`** — индексы для MySQL
- **`.gitignore`** — `data/`, `node_modules`, etc.
