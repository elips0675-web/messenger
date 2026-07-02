import { Router } from 'express';
import pool from '../db.js';
import { auth } from '../middleware.js';

const router = Router();

router.post('/webhook/:token', async (req, res) => {
  const { token } = req.params;
  const [bots] = await pool.query('SELECT * FROM telegram_bot WHERE token = ? AND active = TRUE', [token]);
  if (!bots.length) return res.status(404).json({ message: 'Bot not found' });
  const msg = req.body.message;
  if (!msg) return res.sendStatus(200);
  const chatId = msg.chat.id.toString();
  const text = msg.text || '';
  const userName = msg.from?.first_name || 'Telegram User';
  if (text === '/start') {
    const reply = 'Добро пожаловать! Напишите ваш вопрос, и мы создадим тикет.';
    await sendTelegram(token, chatId, reply);
    return res.sendStatus(200);
  }
  let [tickets] = await pool.query(
    'SELECT * FROM tickets WHERE telegram_chat_id = ? AND status != ? ORDER BY created_at DESC LIMIT 1',
    [chatId, 'closed']
  );
  if (!tickets.length) {
    const [result] = await pool.query(
      `INSERT INTO tickets (subject, description, channel, telegram_chat_id)
       VALUES (?, ?, ?, ?)`,
      [text.substring(0, 100), text, 'telegram', chatId]
    );
    const reply = `Тикет #${result.insertId} создан! Мы ответим вам в ближайшее время.`;
    await sendTelegram(token, chatId, reply);
    await pool.query(
      'INSERT INTO ticket_messages (ticket_id, text, channel) VALUES (?, ?, ?)',
      [result.insertId, text, 'telegram']
    );
  } else {
    const ticket = tickets[0];
    await pool.query(
      'INSERT INTO ticket_messages (ticket_id, text, channel) VALUES (?, ?, ?)',
      [ticket.id, text, 'telegram']
    );
    const reply = `Сообщение добавлено к тикету #${ticket.id}. Ожидайте ответа.`;
    await sendTelegram(token, chatId, reply);
  }
  res.sendStatus(200);
});

router.post('/reply/:ticketId', auth, async (req, res) => {
  const { ticketId } = req.params;
  const { text } = req.body;
  const [tickets] = await pool.query('SELECT * FROM tickets WHERE id = ?', [ticketId]);
  if (!tickets.length) return res.status(404).json({ message: 'Ticket not found' });
  const ticket = tickets[0];
  if (!ticket.telegram_chat_id) return res.status(400).json({ message: 'No Telegram chat' });
  const [bots] = await pool.query('SELECT * FROM telegram_bot WHERE active = TRUE LIMIT 1');
  if (!bots.length) return res.status(400).json({ message: 'No active bot' });
  const reply = `Ответ от поддержки:\n\n${text}`;
  await sendTelegram(bots[0].token, ticket.telegram_chat_id, reply);
  await pool.query(
    'INSERT INTO ticket_messages (ticket_id, user_id, text, channel, is_internal) VALUES (?, ?, ?, ?, ?)',
    [ticketId, req.user?.id || null, text, 'telegram', false]
  );
  res.json({ message: 'Reply sent' });
});

router.post('/bot/register', async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ message: 'Token is required' });
  const [existing] = await pool.query('SELECT * FROM telegram_bot WHERE token = ?', [token]);
  if (existing.length) {
    await pool.query('UPDATE telegram_bot SET active = TRUE WHERE token = ?', [token]);
    return res.json({ message: 'Bot activated' });
  }
  const host = req.headers.host?.split(':')[0] || '127.0.0.1';
  const webhookUrl = `http://${host}:3001/api/telegram/webhook/${token}`;
  await pool.query(
    'INSERT INTO telegram_bot (token, webhook_url, active) VALUES (?, ?, TRUE)',
    [token, webhookUrl]
  );
  try {
    const url = `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}`;
    await fetch(url);
  } catch (e) {
    // webhook set failed, continue
  }
  res.json({ message: 'Bot registered', webhook_url: webhookUrl });
});

async function sendTelegram(token, chatId, text) {
  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text })
    });
  } catch (e) {
    console.error('Telegram send error:', e.message);
  }
}

export default router;
