const nodemailer = require('nodemailer');

const JOURNAL_NAME = 'Muarrix.kiut.uz';
const JOURNAL_SHORT = 'Muarrix.kiut.uz';

function defaultFrom() {
  return process.env.EMAIL_FROM || `${JOURNAL_SHORT} <${process.env.EMAIL_USER}>`;
}

let transporter = null;

// Escape user-supplied strings before embedding in HTML emails
function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  return transporter;
}

async function sendApprovalEmail(toEmail, authorName, submissionTitle, journal, note = '') {
  if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your_email@gmail.com') {
    console.log(`[MAILER STUB] Approval email would be sent to ${toEmail}`);
    return { success: true, stub: true };
  }

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: Arial, sans-serif; color: #333; background: #f5f5f5; margin: 0; padding: 0; }
      .container { max-width: 600px; margin: 30px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
      .header { background: linear-gradient(135deg, #1a3a6b, #2d6bc4); padding: 30px; text-align: center; }
      .header h1 { color: #fff; margin: 0; font-size: 22px; letter-spacing: 0.5px; }
      .header p { color: rgba(255,255,255,0.8); margin: 6px 0 0; font-size: 13px; }
      .body { padding: 36px 32px; }
      .status-badge { display: inline-block; background: #e6f4ea; color: #137333; border-radius: 20px; padding: 6px 18px; font-weight: bold; font-size: 14px; margin-bottom: 20px; }
      .info-box { background: #f8f9fa; border-left: 4px solid #2d6bc4; border-radius: 4px; padding: 16px 20px; margin: 20px 0; }
      .info-box p { margin: 6px 0; font-size: 14px; }
      .info-box strong { color: #1a3a6b; }
      .note-box { background: #fff8e1; border-left: 4px solid #f9a825; border-radius: 4px; padding: 14px 18px; margin: 20px 0; font-size: 14px; }
      .footer { background: #f8f9fa; padding: 20px 32px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eee; }
      .footer a { color: #2d6bc4; text-decoration: none; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>${JOURNAL_NAME}</h1>
        <p>Kimyo International University in Tashkent</p>
      </div>
      <div class="body">
        <p>Hurmatli <strong>${esc(authorName)}</strong>,</p>
        <p>Sizning maqolangiz redaksiya komissiyasidan muvaffaqiyatli o'tdi.</p>
        <div class="status-badge">✔ Tasdiqlandi / Одобрено</div>
        <div class="info-box">
          <p><strong>Maqola nomi / Название:</strong><br>${esc(submissionTitle)}</p>
          <p><strong>Jurnal / Журнал:</strong><br>${esc(journal)}</p>
        </div>
        ${note ? `<div class="note-box"><strong>Izoh / Примечание:</strong><br>${esc(note)}</div>` : ''}
        <p>Keyingi qadamlar uchun shaxsiy kabinetingizga kiring.</p>
        <p style="margin-top:30px">Hurmat bilan,<br><strong>${JOURNAL_NAME} — tahrir kengashi</strong></p>
      </div>
      <div class="footer">
        &copy; ${new Date().getFullYear()} Kimyo International University in Tashkent &nbsp;|&nbsp;
        <a href="https://www.kiut.uz">www.kiut.uz</a>
      </div>
    </div>
  </body>
  </html>`;

  try {
    await getTransporter().sendMail({
      from: defaultFrom(),
      to: toEmail,
      subject: `✅ Maqolangiz tasdiqlandi — ${esc(submissionTitle)}`,
      html,
    });
    return { success: true };
  } catch (err) {
    console.error('Email send error:', err.message);
    return { success: false, error: err.message };
  }
}

async function sendRejectionEmail(toEmail, authorName, submissionTitle, journal, note = '') {
  if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your_email@gmail.com') {
    console.log(`[MAILER STUB] Rejection email would be sent to ${toEmail}`);
    return { success: true, stub: true };
  }

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: Arial, sans-serif; color: #333; background: #f5f5f5; }
      .container { max-width: 600px; margin: 30px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
      .header { background: linear-gradient(135deg, #1a3a6b, #2d6bc4); padding: 30px; text-align: center; }
      .header h1 { color: #fff; margin: 0; font-size: 22px; }
      .header p { color: rgba(255,255,255,0.8); margin: 6px 0 0; font-size: 13px; }
      .body { padding: 36px 32px; }
      .status-badge { display: inline-block; background: #fce8e6; color: #c5221f; border-radius: 20px; padding: 6px 18px; font-weight: bold; font-size: 14px; margin-bottom: 20px; }
      .info-box { background: #f8f9fa; border-left: 4px solid #2d6bc4; border-radius: 4px; padding: 16px 20px; margin: 20px 0; }
      .info-box p { margin: 6px 0; font-size: 14px; }
      .note-box { background: #fff8e1; border-left: 4px solid #f9a825; border-radius: 4px; padding: 14px 18px; margin: 20px 0; font-size: 14px; }
      .footer { background: #f8f9fa; padding: 20px 32px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eee; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>${JOURNAL_NAME}</h1>
        <p>Kimyo International University in Tashkent</p>
      </div>
      <div class="body">
        <p>Hurmatli <strong>${esc(authorName)}</strong>,</p>
        <p>Afsuski, sizning maqolangiz hozirgi ko'rinishda qabul qilinmadi.</p>
        <div class="status-badge">✖ Qaytarildi / Возвращено на доработку</div>
        <div class="info-box">
          <p><strong>Maqola nomi / Название:</strong><br>${esc(submissionTitle)}</p>
          <p><strong>Jurnal / Журнал:</strong><br>${esc(journal)}</p>
        </div>
        ${note ? `<div class="note-box"><strong>Izoh / Примечание редактора:</strong><br>${esc(note)}</div>` : ''}
        <p>Tuzatishlarni kiritib, qaytadan yuborishingiz mumkin.</p>
        <p style="margin-top:30px">Hurmat bilan,<br><strong>${JOURNAL_NAME} — tahrir kengashi</strong></p>
      </div>
      <div class="footer">&copy; ${new Date().getFullYear()} Kimyo International University in Tashkent</div>
    </div>
  </body>
  </html>`;

  try {
    await getTransporter().sendMail({
      from: defaultFrom(),
      to: toEmail,
      subject: `Maqolangiz haqida xabar — ${esc(submissionTitle)}`,
      html,
    });
    return { success: true };
  } catch (err) {
    console.error('Email send error:', err.message);
    return { success: false, error: err.message };
  }
}

async function sendTestEmail(toEmail) {
  if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your_email@gmail.com') {
    return { success: false, error: 'Email не настроен в .env' };
  }
  try {
    await getTransporter().sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: toEmail,
      subject: `Тест — ${JOURNAL_SHORT}`,
      html: `<p>Тестовое письмо отправлено успешно. Email настроен корректно.</p><p style="color:#888;font-size:12px">${new Date().toLocaleString('ru-RU')}</p>`,
    });
    return { success: true };
  } catch (err) {
    console.error('Test email error:', err.message);
    return { success: false, error: err.message };
  }
}

async function sendPasswordResetEmail(toEmail, fullName, resetLink) {
  if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your_email@gmail.com') {
    console.log(`[MAILER STUB] Password reset link for ${toEmail}: ${resetLink}`);
    return { success: true, stub: true };
  }
  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: Arial, sans-serif; color: #333; background: #f5f5f5; margin:0; padding:0; }
      .container { max-width: 600px; margin: 30px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
      .header { background: linear-gradient(135deg, #1a3a6b, #2d6bc4); padding: 30px; text-align: center; }
      .header h1 { color: #fff; margin: 0; font-size: 22px; }
      .header p { color: rgba(255,255,255,0.8); margin: 6px 0 0; font-size: 13px; }
      .body { padding: 36px 32px; }
      .btn { display: inline-block; background: linear-gradient(135deg,#1a3a6b,#2d6bc4); color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: bold; margin: 24px 0; }
      .info { background: #fff8e1; border-left: 4px solid #f9a825; border-radius: 4px; padding: 12px 16px; font-size: 13px; color: #555; margin-top: 20px; }
      .footer { background: #f8f9fa; padding: 20px 32px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eee; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>${JOURNAL_NAME}</h1>
        <p>Kimyo International University in Tashkent</p>
      </div>
      <div class="body">
        <p>Hurmatli <strong>${esc(fullName)}</strong>,</p>
        <p>Siz parolni tiklash so'rovini yubordingiz. / Вы запросили сброс пароля.</p>
        <p>Yangi parol o'rnatish uchun quyidagi tugmani bosing / Нажмите кнопку ниже, чтобы установить новый пароль:</p>
        <div style="text-align:center">
          <a href="${resetLink}" class="btn">🔑 Parolni tiklash / Сбросить пароль</a>
        </div>
        <div class="info">
          ⏰ Ushbu havola <strong>1 soat</strong> amal qiladi. / Ссылка действительна <strong>1 час</strong>.<br>
          Agar siz so'rov yubormagan bo'lsangiz, bu xabarni e'tiborsiz qoldiring. / Если вы не запрашивали сброс — просто игнорируйте письмо.
        </div>
      </div>
      <div class="footer">
        &copy; ${new Date().getFullYear()} Kimyo International University in Tashkent
      </div>
    </div>
  </body>
  </html>`;
  try {
    await getTransporter().sendMail({
      from: defaultFrom(),
      to: toEmail,
      subject: `Parolni tiklash / Сброс пароля — ${JOURNAL_SHORT}`,
      html,
    });
    return { success: true };
  } catch (err) {
    console.error('Password reset email error:', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { sendApprovalEmail, sendRejectionEmail, sendTestEmail, sendPasswordResetEmail };
