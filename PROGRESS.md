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
- **Безопасность — аудит + исправления:**
  - CORS: динамическая проверка origin (вместо `'*'`)
  - CSP: включён strict policy (`default-src 'self'`, `script-src 'self' 'unsafe-inline'`, и т.д.)
  - Error handler: не шлёт `err.message` в production (`NODE_ENV === 'production'`)
  - Telegram роуты: `auth` middleware на `/bot/register` и `/reply/:ticketId`
  - `tickets.js`: удалены дубликаты роутов (было 2 одинаковых блока), хардкодный путь `C:\Users\PC\...` убран
  - SQLite-схема: добавлены колонки `requester_id`, `assignee_id`, `updated_at` в `tickets`, `updated_at` теперь обновляется при PUT
  - SQL-инъекции: проверены все 39 запросов — чисто (все параметризованные)
- **Производительность:**
  - Vite: `manualChunks` — React/React-DOM выделены в `vendor` (кеширование, -12 KB с основного чанка)
  - `axios` удалён из `package.json` (не использовался)
  - `hero.png` (12.8 KB) удалён (не использовался)
- **Chat.jsx — 4 фикса:**
  - Убран `GET /corporate/users` (N+1) — теперь использует `data.members` из ответа чата
  - `currentId` ref — при быстрой навигации старый ответ не перезаписывает новый
  - Cleanup эффекта — `currentId.current = null`
  - `Date.now()` → счётчик `msgIdCounter` (без коллизий ID)
  - Пустой чат: "Нет сообщений. Напишите что-нибудь!"
- **Страница Tickets:**
  - `src/pages/Tickets.jsx` — список тикетов со статусом, приоритетом, каналом
  - Роут `/tickets` + ссылка в сайдбаре "Тикеты 🎫"
- **SQLite для демо на Vercel:**
  - `server/src/db-sqlite.js` — адаптер `better-sqlite3` с полной схемой (52 таблицы) и сид-данными
  - 6 пользователей, 3 чата, сообщения — все как в MySQL
  - Таблицы: `telegram_bot`, `tickets`, `ticket_messages` для Telegram-интеграции
  - `server/src/db.js` — выбор: `DB_TYPE=sqlite` → SQLite, иначе MySQL
  - `DB_PATH = /tmp/corp_messenger.db` на Vercel
  - `data/` в `.gitignore`
- **Telegram интеграция:**
  - `server/src/routes/telegram.js` — вебхук, создание тикетов, ответы через Telegram Bot API
  - Роут `/api/telegram` в `app.js`
- **Оптимизация бэкенда (ранее):**
  - 15+ индексов БД
  - `asyncHandler(fn)` — ~300 строк try/catch убраны из 21 роут-файла
- **Vercel деплой (ранее):**
  - `vercel.json`, `vite.config.js`, `app.js`/`index.js` разделение, `api/index.js`, `VITE_API_URL`
- Все изменения закоммичены и запушины в GitHub

### In Progress
- (none)

### Blocked
- Настройка env-переменных на Vercel (JWT_SECRET, DB_TYPE=sqlite) — нужно вручную

## Key Decisions
- `app.js` отделён от `index.js` — Express как serverless на Vercel
- `DB_TYPE=sqlite` — SQLite вместо MySQL в демо-режиме
- SQLite адаптер: `query()` возвращает `[rows]` / `[{insertId}]` / `[{affectedRows}]` — совместимо с `mysql2/promise`
- CORS: если `CORS_ORIGIN` не задан — пропускаем любой origin (для Vercel, где фронт и бэк на одном домене)

## Next Steps
1. Зайти в Vercel → Settings → Environment Variables → добавить `JWT_SECRET`, `DB_TYPE=sqlite`
2. Перезапустить деплой на Vercel
3. (Опционально) `npm update jsonwebtoken` — убрать CVE в 9.0.2
4. (Опционально) `React.memo` на ChatBubble, UserAvatar — уменьшить ререндеры

## Critical Context
- Бэкенд стабильно отвечает через SQLite (проверено: логин, чаты, задачи, Telegram, тикеты)
- Локально: фронт `localhost:3000/messenger-app/`, бэк `localhost:3001`
- Vercel: `messenger-git-master-...vercel.app`
- Логин: `ceo@company.ru` / `password123` (admin)
- SQLite создаётся с нуля при первом запросе после деплоя (`/tmp`)

## Relevant Files
- **`server/src/db-sqlite.js`** — SQLite адаптер: 52 таблицы, сид, индексы, `query()`-прокси
- **`server/src/db.js`** — выбор MySQL или SQLite через `DB_TYPE`
- **`server/src/app.js`** — Express app, все роуты, CSP, CORS, error handler
- **`server/src/index.js`** — HTTP-сервер + Socket.IO + PeerJS (локально)
- **`server/src/routes/telegram.js`** — Telegram Bot API интеграция
- **`server/src/routes/tickets.js`** — API тикетов (GET, POST, PUT, messages)
- **`src/pages/Chat.jsx`** — Чат с фиксами race condition, N+1, empty state
- **`src/pages/Tickets.jsx`** — Страница тикетов
- **`src/components/Layout.jsx`** — Сайдбар со ссылкой на тикеты
- **`src/App.jsx`** — Роутинг (+ /tickets)
- **`vite.config.js`** — `manualChunks` для vendor
- **`api/index.js`** — Vercel serverless-функция
- **`server/src/middleware.js`** — `asyncHandler(fn)`, `auth`, `adminAuth`
