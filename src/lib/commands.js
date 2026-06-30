const commands = {
  poll: { desc: '/poll "Вопрос" "Вариант1" "Вариант2" — создать опрос', handler: (args, respond) => {
    const parts = args.match(/"([^"]+)"/g);
    if (!parts || parts.length < 3) return respond('❌ Формат: /poll "Вопрос" "Вариант1" "Вариант2"');
    const question = parts[0].replace(/"/g, '');
    const options = parts.slice(1).map(p => p.replace(/"/g, ''));
    const pollMsg = { text: `📊 **${question}**`, poll: { options: options.map(o => ({ text: o, votes: [] })), totalVotes: 0 } };
    respond(null, pollMsg);
  }},

  remind: { desc: '/remind "текст" через 30м — напоминание', handler: (args, respond) => {
    const match = args.match(/"([^"]+)"\s+через\s+(\d+)(м|ч|д)/);
    if (!match) return respond('❌ Формат: /remind "текст" через 30м / 2ч / 1д');
    const text = match[1];
    const amount = parseInt(match[2]);
    const unit = match[3];
    const ms = unit === 'м' ? amount * 60000 : unit === 'ч' ? amount * 3600000 : amount * 86400000;
    const timeStr = unit === 'м' ? `${amount} мин` : unit === 'ч' ? `${amount} ч` : `${amount} д`;
    respond(`⏰ Напоминание: "${text}" через ${timeStr}`);
    setTimeout(() => {
      respond(`⏰ **Напоминание!** ${text}`);
    }, ms);
  }},

  help: { desc: '/help — список команд', handler: (args, respond) => {
    const list = Object.values(commands).map(c => c.desc).join('\n');
    respond(`**Доступные команды:**\n${list}`);
  }},
};

export function parseCommand(input) {
  if (!input.startsWith('/')) return null;
  const parts = input.split(' ');
  const cmd = parts[0].slice(1).toLowerCase();
  const args = input.slice(cmd.length + 2);
  return commands[cmd] ? { cmd, handler: commands[cmd].handler, args } : null;
}

export function getCommandDescriptions() {
  return Object.values(commands).map(c => c.desc);
}
