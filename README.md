# Messenger — корпоративная платформа

Full-stack корпоративный мессенджер с таск-трекером, коллаборацией, базами знаний и управлением согласованиями.  

**Стек:** React 19 + Vite 6 | Express + Socket.IO | MySQL 8.4 | Docker

---

## Возможности

### 💬 Мессенджер
- Личные и групповые чаты
- Сообщения с реакциями, редактированием, удалением
- Индикатор печатания, онлайн-статус
- Поиск по истории
- AES-GCM шифрование сообщений
- Anti-screenshot защита

### ✅ Задачи и проекты
- Канбан-доска с drag-and-drop
- Диаграмма Ганта (день/неделя/месяц)
- Умные подзадачи с AI-генерацией
- Проекты с участниками, файлами, wiki
- Личный план на день

### 📰 Корпоративные фичи
- **Новостная лента** — посты, лайки, комментарии
- **База знаний (Wiki)** — категории, статьи, Markdown, поиск
- **Оргструктура** — древо компании по отделам
- **Согласования (Workflow)** — шаблоны, этапы, утверждение/отклонение
- **Курсы и тесты** — уроки, прогресс, проверка знаний
- **Опросы** — одиночный/множественный выбор, голосование

### 🛠️ Администрирование
- Роли (admin / manager / user)
- Журнал аудита
- Управление пользователями
- Правила хранения данных
- Массовые рассылки

### 🔐 Безопасность
- JWT (access + refresh токены)
- 2FA (TOTP)
- End-to-end шифрование (AES-GCM + PBKDF2)
- Rate limiting, Helmet, CORS
- Защита от скриншотов

---

## Быстрый старт

```bash
# Бэкенд
cd server
cp .env.example .env    # настроить JWT_SECRET
npm install
npm run schema          # создать таблицы
npm run seed            # тестовые данные
npm start

# Фронтенд
cd ..
npm install
npm run dev
```

### Тестовый доступ
- **Логин:** ceo@company.ru
- **Пароль:** password123
- **Роль:** admin

---

## Архитектура

```
messenger/
├── server/            # Express + Socket.IO API (порт 3001)
│   └── src/
│       ├── routes/    # auth, chats, tasks, wiki, workflows, courses, polls...
│       ├── middleware.js
│       ├── db.js
│       └── ws.js      # WebSocket (чат, уведомления, доски)
├── src/               # React + Vite фронтенд (порт 3000)
│   ├── pages/         # 37 страниц
│   ├── components/    # Layout, Loading, EmptyState, StatusBadge...
│   └── lib/           # api, helpers, crypto, useFetch, ai...
└── database/
    └── schema.sql     # синхронизирован с schema.js
```

### Основные таблицы (42)
`users`, `chats`, `messages`, `tasks`, `subtasks`, `projects`, `notifications`, `departments`, `posts`, `wiki_articles`, `workflows`, `workflow_requests`, `courses`, `course_lessons`, `quiz_questions`, `polls`, `poll_votes` и др.

---

## Развёртывание

### Docker
```bash
docker compose up -d
```

### Vercel (фронтенд)
Подключите репозиторий — Vite build настроен автоматически.
Build команда: `npm run build`
Output: `dist/`

---

## Оптимизация
- Lazy loading всех 37 страниц (React.lazy + Suspense)
- useFetch — хук для загрузки данных (используется в 7 страницах)
- Общие компоненты: Loading, EmptyState, StatusBadge
- helpers.js — централизованные утилиты (formatDate, getToken, calcPercent)

---

## Лицензия
MIT
