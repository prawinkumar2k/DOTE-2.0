const nodemailer = require('nodemailer');

/**
 * Send a single email.
 * Without SMTP_HOST → skips send, logs preview, returns { skipped: true }.
 *
 * Set in server/.env (restart Node after changes):
 *   FRONTEND_URL=https://your-domain.com
 *   SMTP_HOST=smtp.gmail.com
 *   SMTP_PORT=465
 *   SMTP_SECURE=true
 *   SMTP_USER=you@gmail.com
 *   SMTP_PASS=app-password-16-chars
 *   MAIL_FROM=DOTE Portal <you@gmail.com>
 *
 * Gmail: use an App Password (Google Account → Security → 2-Step → App passwords), not your normal password.
 * Self-hosted/VPS mail: often port 587, SMTP_SECURE=false, optional SMTP_TLS_REJECT_UNAUTHORIZED=false.
 */
async function sendMail({ to, subject, text, html }) {
  const host = process.env.SMTP_HOST;
  if (!host) {
    const preview = (text || html || '').slice(0, 200);
    console.log(`[mail] SMTP not configured. Would send to ${to}: ${subject}\n${preview}...`);
    return { ok: false, skipped: true };
  }

  const port = Number(process.env.SMTP_PORT) || 587;
  const secure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true';
  const tlsReject =
    String(process.env.SMTP_TLS_REJECT_UNAUTHORIZED || 'true').toLowerCase() !== 'false';

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS != null && String(process.env.SMTP_PASS) !== ''
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    tls: tlsReject ? undefined : { rejectUnauthorized: false },
  });

  try {
    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM || `"DOTE Portal" <${process.env.SMTP_USER || 'noreply@localhost'}>`,
      to,
      subject,
      text,
      html,
    });
    console.log(`[mail] sent to ${to} messageId=${info.messageId}`);
    return { ok: true };
  } catch (err) {
    console.error('[mail] send failed:', err.message);
    throw err;
  }
}

module.exports = { sendMail };
