import nodemailer from 'nodemailer';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  if (!host) return null;
  transporter = nodemailer.createTransport({
    host,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporter;
}

const FROM = process.env.SMTP_FROM || 'noreply@corp-messenger.app';

export async function sendPasswordResetEmail(to, token) {
  const transport = getTransporter();
  if (!transport) {
    console.log(`[mail] SMTP not configured. Would send password reset to ${to}: token=${token}`);
    return;
  }
  const resetUrl = `${process.env.CORS_ORIGIN || 'http://localhost:5173'}/reset-password?token=${token}`;
  await transport.sendMail({
    from: FROM,
    to,
    subject: 'Сброс пароля — Корпоративный мессенджер',
    html: `<p>Нажмите <a href="${resetUrl}">сюда</a> для сброса пароля. Ссылка действует 1 час.</p>`,
  });
}

export async function sendNotificationEmail(to, subject, html) {
  const transport = getTransporter();
  if (!transport) {
    console.log(`[mail] SMTP not configured. Would send email to ${to}: ${subject}`);
    return;
  }
  await transport.sendMail({ from: FROM, to, subject, html });
}
