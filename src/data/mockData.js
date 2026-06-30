const departments = [
  { id: 1, name: 'Руководство', head: 'Алексей Волков' },
  { id: 2, name: 'IT-отдел', head: 'Дмитрий Козлов' },
  { id: 3, name: 'Бухгалтерия', head: 'Елена Соколова' },
  { id: 4, name: 'HR', head: 'Анна Белова' },
];

const users = [
  { id: 1, name: 'Алексей Волков', email: 'ceo@company.ru', title: 'CEO', avatar: 'AV', dept: 1, phone: '+7 (999) 111-22-33', online: true, lastSeen: 'сейчас', systemRole: 'admin' },
  { id: 2, name: 'Дмитрий Козлов', email: 'it@company.ru', title: 'IT Director', avatar: 'DK', dept: 2, phone: '+7 (999) 222-33-44', online: true, lastSeen: 'сейчас', systemRole: 'manager' },
  { id: 3, name: 'Иван Петров', email: 'dev1@company.ru', title: 'Senior Dev', avatar: 'IP', dept: 2, phone: '+7 (999) 333-44-55', online: true, lastSeen: 'сейчас', systemRole: 'user' },
  { id: 4, name: 'Елена Соколова', email: 'buh@company.ru', title: 'Head Acc.', avatar: 'ES', dept: 3, phone: '+7 (999) 444-55-66', online: false, lastSeen: 'был(а) в 12:30', systemRole: 'manager' },
  { id: 5, name: 'Анна Белова', email: 'hr@company.ru', title: 'HR Manager', avatar: 'AB', dept: 4, phone: '+7 (999) 555-66-77', online: false, lastSeen: 'был(а) вчера в 16:20', systemRole: 'manager' },
  { id: 6, name: 'Мария Смирнова', email: 'dev2@company.ru', title: 'Junior Dev', avatar: 'MS', dept: 2, phone: '+7 (999) 666-77-88', online: true, lastSeen: 'сейчас', systemRole: 'user' },
  { id: 7, name: 'Олег Новиков', email: 'oleg@company.ru', title: 'Sysadmin', avatar: 'ON', dept: 2, phone: '+7 (999) 777-88-99', online: false, lastSeen: 'был(а) в 09:15', systemRole: 'user' },
  { id: 8, name: 'Татьяна Морозова', email: 'tanya@company.ru', title: 'Accountant', avatar: 'TM', dept: 3, phone: '+7 (999) 888-99-00', online: false, lastSeen: 'был(а) вчера в 18:00', systemRole: 'user' },
];

const chats = [
  {
    id: 1, name: 'Общий чат', type: 'group', avatar: '🏢',
    lastMsg: 'Всем привет! Новый билд на тестовом сервере',
    lastTime: '10:42', unread: 3,
    members: [1, 2, 3, 4, 5, 6],
    messages: [
      { id: 1, userId: 2, text: 'Коллеги, сегодня релиз в 18:00', time: '09:30', reactions: { '👍': [5] }, readBy: [1, 2, 3, 4, 5, 6] },
      { id: 2, userId: 5, text: 'Принято, готовим документы', time: '09:35', edited: true, reactions: {}, readBy: [1, 2, 3] },
      { id: 3, userId: 3, text: 'Всем привет! Новый билд на тестовом сервере', time: '10:42', reactions: { '🔥': [2], '👍': [6] }, readBy: [1, 2] },
    ],
  },
  {
    id: 2, name: 'IT-команда', type: 'group', avatar: '💻',
    lastMsg: 'Дим, глянь пулл-реквест', lastTime: '11:15', unread: 1,
    members: [2, 3, 6],
    messages: [
      { id: 1, userId: 3, text: 'Дим, глянь пулл-реквест', time: '11:15', reactions: {}, readBy: [2, 3] },
      { id: 2, userId: 2, text: 'Ок, сейчас посмотрю', time: '11:18', reactions: { '👀': [6] }, readBy: [2, 3, 6] },
      { id: 3, userId: 6, text: 'Я проверила, всё ок', time: '11:22', reactions: {}, readBy: [2, 3] },
    ],
  },
  {
    id: 3, name: 'Срочное', type: 'group', avatar: '⚡',
    lastMsg: 'Срочно нужен отчёт по проекту!', lastTime: 'Вчера', unread: 0,
    members: [1, 2, 4],
    messages: [
      { id: 1, userId: 1, text: 'Срочно нужен отчёт по проекту!', time: 'Вчера 17:00', reactions: {}, readBy: [1, 2] },
      { id: 2, userId: 4, text: 'Готовлю, будет через час', time: 'Вчера 17:05', reactions: { '👍': [1] }, readBy: [1, 4] },
      { id: 3, userId: 1, text: 'Жду.', time: 'Вчера 17:06', reactions: {}, readBy: [1] },
    ],
  },
  // Personal chats — для каждого пользователя свой личный чат
  {
    id: 4, name: 'Иван Петров', type: 'personal', avatar: 'IP',
    lastMsg: 'Ок, всё сделаю', lastTime: '11:30', unread: 2,
    members: [1, 3], userId: 3,
    messages: [
      { id: 1, userId: 3, text: 'Привет! Нужно обновить API', time: '11:00', reactions: {}, readBy: [1, 3] },
      { id: 2, userId: 1, text: 'Сделаешь к вечеру?', time: '11:05', reactions: {}, readBy: [1] },
      { id: 3, userId: 3, text: 'Ок, всё сделаю', time: '11:30', reactions: {}, readBy: [] },
    ],
  },
  {
    id: 5, name: 'Мария Смирнова', type: 'personal', avatar: 'MS',
    lastMsg: 'Готово! Проверьте пожалуйста', lastTime: '10:15', unread: 0,
    members: [1, 6], userId: 6,
    messages: [
      { id: 1, userId: 6, text: 'Алексей, я доделала уведомления', time: '10:10', reactions: {}, readBy: [1] },
      { id: 2, userId: 6, text: 'Готово! Проверьте пожалуйста', time: '10:15', reactions: {}, readBy: [1] },
    ],
  },
  {
    id: 6, name: 'Дмитрий Козлов', type: 'personal', avatar: 'DK',
    lastMsg: 'Ок', lastTime: 'Вчера', unread: 0,
    members: [1, 2], userId: 2,
    messages: [
      { id: 1, userId: 2, text: 'Алексей, подпиши договор', time: 'Вчера 14:00', reactions: {}, readBy: [1, 2] },
      { id: 2, userId: 1, text: 'Ок', time: 'Вчера 14:10', reactions: {}, readBy: [1] },
    ],
  },
  {
    id: 7, name: 'Елена Соколова', type: 'personal', avatar: 'ES',
    lastMsg: 'Отчёт готов', lastTime: 'Вчера', unread: 1,
    members: [1, 4], userId: 4,
    messages: [
      { id: 1, userId: 4, text: 'Алексей, отчёт по кварталу готов', time: 'Вчера 16:00', reactions: {}, readBy: [1, 4] },
      { id: 2, userId: 4, text: 'Посмотрите, пожалуйста', time: 'Вчера 16:05', reactions: {}, readBy: [] },
    ],
  },
  {
    id: 8, name: 'Анна Белова', type: 'personal', avatar: 'AB',
    lastMsg: 'Принято!', lastTime: 'Вчера', unread: 0,
    members: [1, 5], userId: 5,
    messages: [
      { id: 1, userId: 5, text: 'Встречу подтверждаю', time: 'Вчера 11:00', reactions: {}, readBy: [1, 5] },
      { id: 2, userId: 1, text: 'Принято!', time: 'Вчера 11:05', reactions: {}, readBy: [1] },
    ],
  },
  {
    id: 9, name: 'Олег Новиков', type: 'personal', avatar: 'ON',
    lastMsg: 'Сервер обновлён', lastTime: 'Пн', unread: 0,
    members: [1, 7], userId: 7,
    messages: [
      { id: 1, userId: 7, text: 'Сервер обновлён, можно работать', time: 'Пн 09:30', reactions: {}, readBy: [1, 7] },
    ],
  },
  {
    id: 10, name: 'Татьяна Морозова', type: 'personal', avatar: 'TM',
    lastMsg: 'Спасибо!', lastTime: 'Пн', unread: 0,
    members: [1, 8], userId: 8,
    messages: [
      { id: 1, userId: 8, text: 'Документы подписаны', time: 'Пн 17:00', reactions: {}, readBy: [1, 8] },
      { id: 2, userId: 1, text: 'Спасибо!', time: 'Пн 17:05', reactions: {}, readBy: [1] },
    ],
  },
];

const tasks = [
  {
    id: 1, title: 'Разработать API чатов', status: 'done', priority: 'high',
    assignee: 3, creator: 2, dept: 2,
    desc: 'Разработать REST API для чатов с поддержкой WebSocket.',
    deadline: '2026-07-01', created: '2026-06-15',
    subtasks: [
      { id: 1, title: 'Спроектировать схему БД', done: true },
      { id: 2, title: 'Написать CRUD для сообщений', done: true },
      { id: 3, title: 'Подключить Socket.IO', done: true },
    ],
  },
  {
    id: 2, title: 'Внедрить систему уведомлений', status: 'progress', priority: 'high',
    assignee: 6, creator: 2, dept: 2,
    desc: 'Email и push-уведомления для задач и сообщений.',
    deadline: '2026-07-15', created: '2026-06-20',
    subtasks: [
      { id: 1, title: 'Настроить очередь задач', done: true },
      { id: 2, title: 'Интеграция с SMTP', done: false },
      { id: 3, title: 'WebSocket уведомления', done: false },
    ],
  },
  {
    id: 3, title: 'Сверка квартальных отчётов', status: 'progress', priority: 'medium',
    assignee: 4, creator: 1, dept: 3,
    desc: 'Подготовить отчёт по расходам и доходам за Q2.',
    deadline: '2026-07-10', created: '2026-06-25',
    subtasks: [],
  },
  {
    id: 4, title: 'Наём фронтенд-разработчика', status: 'progress', priority: 'medium',
    assignee: 5, creator: 1, dept: 4,
    desc: 'Провести собеседования, найти senior React-разработчика.',
    deadline: '2026-07-31', created: '2026-06-18',
    subtasks: [
      { id: 1, title: 'Разместить вакансию', done: true },
      { id: 2, title: 'Отобрать резюме', done: true },
      { id: 3, title: 'Провести тех. собеседование', done: false },
    ],
  },
  {
    id: 5, title: 'Рефакторинг модуля авторизации', status: 'todo', priority: 'low',
    assignee: 6, creator: 3, dept: 2,
    desc: 'Переписать auth-модуль на JWT с refresh-токенами.',
    deadline: '2026-08-01', created: '2026-06-28',
    subtasks: [],
  },
];

const notifications = [
  { id: 1, text: 'Иван Петров завершил задачу "Разработать API чатов"', time: '10:30', type: 'task' },
  { id: 2, text: 'Дмитрий Козлов упомянул вас в IT-команде', time: '11:15', type: 'mention' },
  { id: 3, text: 'Срок задачи "Сверка отчётов" истекает через 3 дня', time: '09:00', type: 'deadline' },
  { id: 4, text: 'HR приглашает на корпоратив в пятницу', time: 'Вчера 16:00', type: 'event' },
  { id: 5, text: 'Новый сотрудник присоединился к компании', time: 'Вчера 14:20', type: 'system' },
];

const projects = [
  {
    id: 1, name: 'Разработка мессенджера', avatar: '💬', dept: 2, lead: 2,
    desc: 'Создание корпоративного мессенджера с чатами, задачами и интеграциями.',
    created: '2026-06-01', deadline: '2026-09-01', status: 'active',
    members: [2, 3, 6], taskIds: [1, 2, 5],
    files: [
      { id: 1, name: 'specification.pdf', size: '2.4 MB', user: 3, time: '20.06 14:00' },
      { id: 2, name: 'mockup_v2.fig', size: '8.1 MB', user: 6, time: '22.06 11:30' },
    ],
    wiki: '## Архитектура\nПроект на React + Express + MySQL.\n\n## API\n- `GET /api/chats` — список чатов\n- `POST /api/tasks` — создание задачи',
    chat: [
      { id: 1, userId: 2, text: 'Коллеги, начинаем проект', time: '01.06 09:00' },
      { id: 2, userId: 3, text: 'Готов спецификации', time: '05.06 14:30' },
      { id: 3, userId: 6, text: 'Мокапы готовы', time: '22.06 12:00' },
    ],
  },
  {
    id: 2, name: 'Автоматизация отчётности', avatar: '📊', dept: 3, lead: 4,
    desc: 'Разработать систему автоматической генерации квартальных отчётов.',
    created: '2026-06-15', deadline: '2026-08-15', status: 'active',
    members: [4, 1], taskIds: [3],
    files: [
      { id: 3, name: 'requirements.xlsx', size: '1.2 MB', user: 1, time: '15.06 10:00' },
    ],
    wiki: '## Требования\nАвтоматическая выгрузка из 1С в PDF.\n\n## Контакты\nБухгалтерия — Елена Соколова',
    chat: [
      { id: 1, userId: 1, text: 'Нужны требования к отчётам', time: '15.06 10:00' },
      { id: 2, userId: 4, text: 'Готовим макет', time: '16.06 11:00' },
    ],
  },
  {
    id: 3, name: 'Подбор персонала', avatar: '👥', dept: 4, lead: 5,
    desc: 'Закрыть вакансии фронтенд и тестировщик до конца квартала.',
    created: '2026-06-10', deadline: '2026-08-01', status: 'active',
    members: [5, 1], taskIds: [4],
    files: [],
    wiki: '## Вакансии\n1. Senior React Developer\n2. QA Engineer',
    chat: [
      { id: 1, userId: 5, text: 'Разместила вакансии на hh.ru', time: '18.06 09:00' },
      { id: 2, userId: 1, text: 'Отлично, жду резюме', time: '18.06 09:30' },
    ],
  },
];

const taskActivity = [
  { id: 1, taskId: 1, userId: 3, action: 'создал задачу', time: '15.06 09:00' },
  { id: 2, taskId: 1, userId: 3, action: 'завершил подзадачу "Спроектировать схему БД"', time: '16.06 14:20' },
  { id: 3, taskId: 1, userId: 3, action: 'завершил подзадачу "Написать CRUD для сообщений"', time: '20.06 11:30' },
  { id: 4, taskId: 1, userId: 3, action: 'завершил подзадачу "Подключить Socket.IO"', time: '25.06 16:45' },
  { id: 5, taskId: 1, userId: 2, action: 'изменил статус на "Готово"', time: '28.06 10:00' },
  { id: 6, taskId: 2, userId: 2, action: 'создал задачу', time: '20.06 08:30' },
  { id: 7, taskId: 2, userId: 6, action: 'завершил подзадачу "Настроить очередь задач"', time: '25.06 13:10' },
  { id: 8, taskId: 2, userId: 6, action: 'начал работу', time: '22.06 09:00' },
  { id: 9, taskId: 3, userId: 1, action: 'создал задачу', time: '25.06 15:00' },
  { id: 10, taskId: 3, userId: 4, action: 'начал работу', time: '26.06 10:00' },
  { id: 11, taskId: 4, userId: 1, action: 'создал задачу', time: '18.06 12:00' },
  { id: 12, taskId: 4, userId: 5, action: 'завершил подзадачу "Разместить вакансию"', time: '20.06 09:15' },
  { id: 13, taskId: 4, userId: 5, action: 'завершил подзадачу "Отобрать резюме"', time: '25.06 17:30' },
  { id: 14, taskId: 5, userId: 3, action: 'создал задачу', time: '28.06 11:00' },
];

const actionLog = [
  { id: 1, userId: 1, action: 'Создал пользователя Татьяна Морозова', target: 'user', time: '29.06 10:00' },
  { id: 2, userId: 1, action: 'Заблокировал пользователя Олег Новиков', target: 'user', time: '28.06 15:30' },
  { id: 3, userId: 2, action: 'Изменил роль пользователя Мария Смирнова', target: 'user', time: '27.06 12:00' },
  { id: 4, userId: 1, action: 'Создал отдел «Маркетинг»', target: 'dept', time: '25.06 09:00' },
  { id: 5, userId: 4, action: 'Изменил дедлайн задачи #3', target: 'task', time: '24.06 16:20' },
  { id: 6, userId: 1, action: 'Назначил руководителя отдела IT', target: 'dept', time: '20.06 11:00' },
  { id: 7, userId: 3, action: 'Загрузил файл spec.pdf', target: 'file', time: '19.06 14:15' },
  { id: 8, userId: 5, action: 'Создал задачу #4', target: 'task', time: '18.06 12:00' },
];

const systemRoles = ['admin', 'manager', 'user'];

const fileFolders = [
  { id: 1, name: 'Документы', parentId: null, files: [
    { id: 1, name: 'Устав компании.pdf', size: '2.1 MB', type: 'pdf', userId: 1, time: '20.06 14:00' },
    { id: 2, name: 'Договор с клиентом.docx', size: '1.4 MB', type: 'docx', userId: 4, time: '18.06 11:30' },
  ]},
  { id: 2, name: 'Шаблоны', parentId: null, files: [
    { id: 3, name: 'Отчёт Q2.xlsx', size: '856 KB', type: 'xlsx', userId: 4, time: '25.06 09:15' },
    { id: 4, name: 'Презентация.pptx', size: '5.2 MB', type: 'pptx', userId: 1, time: '22.06 16:00' },
  ]},
  { id: 3, name: 'Изображения', parentId: null, files: [
    { id: 5, name: 'office.jpg', size: '3.4 MB', type: 'img', userId: 6, time: '15.06 10:00' },
    { id: 6, name: 'logo.png', size: '124 KB', type: 'img', userId: 6, time: '10.06 13:20' },
    { id: 7, name: 'screenshot.jpg', size: '2.8 MB', type: 'img', userId: 3, time: '28.06 15:45' },
  ]},
  { id: 4, name: 'Архивы', parentId: null, files: [
    { id: 8, name: 'backup_2026_06.zip', size: '156 MB', type: 'zip', userId: 2, time: '29.06 04:00' },
  ]},
];

const FILE_ICONS = { pdf: '📄', docx: '📝', xlsx: '📊', pptx: '📽️', img: '🖼️', zip: '📦', default: '📎' };

export { departments, users, chats, tasks, notifications, taskActivity, projects, actionLog, systemRoles, fileFolders, FILE_ICONS };
