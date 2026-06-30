export const channels = [
  { id: 1, name: 'Общий', desc: 'Для всех сотрудников', type: 'open', members: [1,2,3,4,5,6,7,8], pin: 'Важные новости компании', created: '01.06.2026', owner: 1 },
  { id: 2, name: 'IT-новости', desc: 'Технические обновления и релизы', type: 'open', members: [1,2,3,6,7], pin: null, created: '05.06.2026', owner: 2 },
  { id: 3, name: 'HR-вакансии', desc: 'Обсуждение найма', type: 'closed', members: [1,5], pin: null, created: '10.06.2026', owner: 5 },
];

export const events = [
  { id: 1, title: 'Планёрка', date: '2026-07-01', time: '10:00', desc: 'Еженедельная плановая встреча', creator: 1 },
  { id: 2, title: 'Релиз v2.0', date: '2026-07-05', time: '18:00', desc: 'Релиз новой версии мессенджера', creator: 2 },
  { id: 3, title: 'ДР Анны', date: '2026-07-15', time: '12:00', desc: 'День рождения, собираемся в переговорной', creator: 5 },
  { id: 4, title: 'Квартальный отчёт', date: '2026-07-10', time: '14:00', desc: 'Сдача квартальной отчётности', creator: 4 },
  { id: 5, title: 'Собеседование', date: '2026-07-03', time: '11:00', desc: 'Кандидат на позицию Senior Dev', creator: 5 },
  { id: 6, title: 'Командировка', date: '2026-07-20', time: '09:00', desc: 'Встреча с партнёрами в Москве', creator: 1 },
];

export const customEmoji = [
  { name: 'party', url: '🎉' },
  { name: 'rocket', url: '🚀' },
  { name: 'fire', url: '🔥' },
  { name: 'clap', url: '👏' },
];
