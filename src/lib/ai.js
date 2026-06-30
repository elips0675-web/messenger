const ICEBREAKERS = [
  { icon: '💼', ru: 'Какая задача сейчас в приоритете?', en: 'What is your top priority right now?' },
  { icon: '☕', ru: 'Кофе или чай?', en: 'Coffee or tea?' },
  { icon: '🏖️', ru: 'Где хотели бы провести отпуск?', en: 'Where would you like to go on vacation?' },
  { icon: '📚', ru: 'Какую книгу сейчас читаете?', en: 'What book are you reading?' },
  { icon: '🎧', ru: 'Что слушаете в последнее время?', en: 'What have you been listening to lately?' },
  { icon: '🎬', ru: 'Какой фильм недавно понравился?', en: 'What movie did you enjoy recently?' },
  { icon: '💡', ru: 'Какая идея вас вдохновляет?', en: 'What idea inspires you?' },
  { icon: '🏆', ru: 'Какое достижение в этом году?', en: 'What is your achievement this year?' },
  { icon: '🌍', ru: 'Какая страна мечты для путешествия?', en: 'What dream country to travel to?' },
  { icon: '🎯', ru: 'Какая цель на ближайший месяц?', en: 'What is your goal for the next month?' },
  { icon: '🎨', ru: 'Какое хобби недавно освоили?', en: 'What hobby have you recently picked up?' },
  { icon: '🍳', ru: 'Что умеете готовить лучше всего?', en: 'What is your best dish to cook?' },
  { icon: '🏃', ru: 'Занимаетесь спортом?', en: 'Do you do sports?' },
  { icon: '🧘', ru: 'Как отдыхаете после работы?', en: 'How do you relax after work?' },
  { icon: '🎮', ru: 'Играете в игры?', en: 'Do you play games?' },
];

export function getIcebreakers(count = 5) {
  const shuffled = [...ICEBREAKERS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function getRandomIcebreaker() {
  return ICEBREAKERS[Math.floor(Math.random() * ICEBREAKERS.length)];
}

export function aiSuggestTask(title) {
  const suggestions = {
    отчёт: ['Собрать данные из CRM', 'Согласовать с руководителем', 'Отправить на почту'],
    встреча: ['Подготовить повестку', 'Назначить участников', 'Разослать материалы'],
    письмо: ['Составить черновик', 'Проверить орфографию', 'Согласовать с юристом'],
    договор: ['Проверить условия', 'Подписать у директора', 'Отсканировать в архив'],
    презентац: ['Собрать слайды', 'Вычитать текст', 'Подготовить раздатки'],
  };
  const lower = title.toLowerCase();
  for (const [key, steps] of Object.entries(suggestions)) {
    if (lower.includes(key)) return steps;
  }
  return ['Уточнить требования', 'Составить план', 'Выполнить', 'Отчитаться'];
}
