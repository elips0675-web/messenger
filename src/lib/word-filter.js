const FORBIDDEN_WORD_ROOTS = [
  'хуй', 'хуи', 'хуе', 'хуя', 'пизд', 'ебан', 'ебал', 'бля', 'ебл', 'муд', 'сука', 'залуп', 'уеб',
  'fuck', 'cunt', 'shit', 'bitch', 'asshole', 'dick',
  'мразь', 'урод', 'дебил', 'шлюх', 'пидор', 'гандон',
  'уби', 'насил', 'террор', 'расправ', 'взорв',
  'купи', 'продай', 'акция', 'скидк', 'заработ', 'казино', 'ставк', 'крипт',
  'нарко', 'оружи', 'порно', 'секс',
];

export function containsForbiddenWords(text) {
  const lower = text.toLowerCase();
  return FORBIDDEN_WORD_ROOTS.some(root => lower.includes(root));
}

export function isGibberish(text) {
  const normalized = text.toLowerCase().trim();
  if (!normalized) return false;
  if (/(.)\1{4,}/.test(normalized)) return true;

  const lettersOnly = normalized.replace(/[^a-zа-яё]/g, '');
  if (lettersOnly.length >= 6) {
    const uniqueCount = new Set(lettersOnly).size;
    if (uniqueCount / lettersOnly.length < 0.35) return true;
  }

  const words = normalized.split(/\s+/);
  for (const word of words) {
    const letters = word.replace(/[^a-zа-яё]/g, '');
    if (letters.length < 3) continue;
    const vowels = letters.match(/[aeiouyаеёиоуыэюя]/g);
    if (!vowels || vowels.length === 0) return true;

    const mashPatterns = [
      'asdf', 'sdfg', 'dfgh', 'fghj', 'йцук', 'цуке', 'укен', 'кенг',
      'фыва', 'ывап', 'вапр', 'апро', 'прол', 'ролд', 'олдж',
    ];
    for (const pattern of mashPatterns) {
      if (letters.includes(pattern)) return true;
    }
  }
  return false;
}
