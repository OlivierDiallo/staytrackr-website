const express = require('express');
const path    = require('path');
const fs      = require('fs');
const { Resend } = require('resend');

// Load .env if present (local dev)
try { require('fs').readFileSync('.env', 'utf8').split('\n').forEach(l => { const [k,...v] = l.split('='); if (k && !k.startsWith('#')) process.env[k.trim()] = v.join('=').trim(); }); } catch {}

const app    = express();
const PORT   = process.env.PORT || 3000;
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// ─── Data directory ───────────────────────────────────────────────
const DATA_DIR      = path.join(__dirname, 'data');
const CONTACTS_FILE = path.join(DATA_DIR, 'contacts.json');
const SIGNUPS_FILE  = path.join(DATA_DIR, 'signups.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(CONTACTS_FILE)) fs.writeFileSync(CONTACTS_FILE, '[]');
if (!fs.existsSync(SIGNUPS_FILE))  fs.writeFileSync(SIGNUPS_FILE,  '[]');

// ─── Middleware ───────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Pages ───────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/privacy', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'privacy.html'));
});

app.get('/terms', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'terms.html'));
});

app.get('/support', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'support.html'));
});

app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'contact.html'));
});

// ─── Contact form submission ──────────────────────────────────────
app.post('/contact', (req, res) => {
  const { name, email, subject, message, device } = req.body;

  // Basic validation
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  if (!/\S+@\S+\.\S+/.test(email)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }

  if (message.trim().length < 10) {
    return res.status(400).json({ error: 'Message too short.' });
  }

  // Append to contacts.json
  try {
    const contacts = JSON.parse(fs.readFileSync(CONTACTS_FILE, 'utf8'));
    contacts.push({
      id:        Date.now(),
      timestamp: new Date().toISOString(),
      name:      name.trim(),
      email:     email.trim().toLowerCase(),
      subject,
      message:   message.trim(),
      device:    device ? device.trim() : null,
      status:    'new',
    });
    fs.writeFileSync(CONTACTS_FILE, JSON.stringify(contacts, null, 2));
    console.log(`[contact] New message from ${name} <${email}> — ${subject}`);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[contact] Failed to save message:', err);
    return res.status(500).json({ error: 'Failed to save message. Please try again.' });
  }
});

// ─── Confirmation email template ─────────────────────────────────
function confirmationEmailHtml(email) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;max-width:560px;width:100%;">

      <!-- Header -->
      <tr><td style="background:#080b09;padding:32px 40px;text-align:center;">
        <div style="display:inline-flex;align-items:center;gap:10px;">
          <span style="font-size:28px;">🏠</span>
          <span style="color:#ffffff;font-size:20px;font-weight:800;letter-spacing:-0.5px;">StayTrackr</span>
        </div>
      </td></tr>

      <!-- Hero band -->
      <tr><td style="background:#1FB86E;padding:6px 0;"></td></tr>

      <!-- Body -->
      <tr><td style="padding:40px 40px 32px;">
        <h1 style="margin:0 0 12px;font-size:26px;font-weight:800;color:#0d0d0d;line-height:1.2;">
          You're on the list! 🎉
        </h1>
        <p style="margin:0 0 20px;font-size:15px;color:#555;line-height:1.7;">
          Thanks for signing up — you'll be among the first to know when StayTrackr launches on the App Store.
        </p>
        <p style="margin:0 0 28px;font-size:15px;color:#555;line-height:1.7;">
          We'll keep you posted on:
        </p>
        <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
          <tr><td style="padding:6px 0;">
            <span style="color:#1FB86E;font-weight:700;margin-right:10px;">✓</span>
            <span style="font-size:14px;color:#333;">Launch date &amp; App Store link</span>
          </td></tr>
          <tr><td style="padding:6px 0;">
            <span style="color:#1FB86E;font-weight:700;margin-right:10px;">✓</span>
            <span style="font-size:14px;color:#333;">New features &amp; updates</span>
          </td></tr>
          <tr><td style="padding:6px 0;">
            <span style="color:#1FB86E;font-weight:700;margin-right:10px;">✓</span>
            <span style="font-size:14px;color:#333;">Exclusive early-access offers</span>
          </td></tr>
        </table>

        <a href="https://staytrackr.app" style="display:inline-block;background:#1FB86E;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 28px;border-radius:10px;">
          Visit StayTrackr →
        </a>
      </td></tr>

      <!-- Divider -->
      <tr><td style="padding:0 40px;"><hr style="border:none;border-top:1px solid #f0f0f0;margin:0;"/></td></tr>

      <!-- Footer -->
      <tr><td style="padding:24px 40px;text-align:center;">
        <p style="margin:0;font-size:12px;color:#aaa;line-height:1.6;">
          You're receiving this because you signed up at staytrackr.app.<br/>
          <a href="mailto:hello@staytrackr.app" style="color:#1FB86E;text-decoration:none;">hello@staytrackr.app</a>
          &nbsp;·&nbsp;
          <a href="https://staytrackr.app/privacy" style="color:#aaa;text-decoration:none;">Privacy Policy</a>
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

// ─── Mailing list signup ──────────────────────────────────────────
app.get('/signup/count', (req, res) => {
  try {
    const signups = JSON.parse(fs.readFileSync(SIGNUPS_FILE, 'utf8'));
    res.json({ count: signups.length });
  } catch {
    res.json({ count: 0 });
  }
});

app.post('/signup', async (req, res) => {
  const { email } = req.body;

  if (!email || !/\S+@\S+\.\S+/.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  const normalised = email.trim().toLowerCase();

  try {
    // Save locally
    const signups = JSON.parse(fs.readFileSync(SIGNUPS_FILE, 'utf8'));
    const alreadyExists = !!signups.find(s => s.email === normalised);

    if (!alreadyExists) {
      signups.push({ id: Date.now(), email: normalised, timestamp: new Date().toISOString(), source: 'website' });
      fs.writeFileSync(SIGNUPS_FILE, JSON.stringify(signups, null, 2));
      console.log(`[signup] ${normalised} joined the mailing list (total: ${signups.length})`);
    }

    // Resend: add to audience + send confirmation email
    if (resend && !alreadyExists) {
      // Add to audience (if configured)
      if (process.env.RESEND_AUDIENCE_ID) {
        await resend.contacts.create({
          email: normalised,
          audienceId: process.env.RESEND_AUDIENCE_ID,
          unsubscribed: false,
        }).catch(e => console.error('[resend] audience add failed:', e.message));
      }

      // Send confirmation email
      const from = process.env.RESEND_FROM || 'StayTrackr <onboarding@resend.dev>';
      await resend.emails.send({
        from,
        to: normalised,
        subject: "You're on the list 🏠",
        html: confirmationEmailHtml(normalised),
      }).catch(e => console.error('[resend] email send failed:', e.message));
    }

    return res.status(200).json({ ok: true, count: signups.length, alreadyExists });
  } catch (err) {
    console.error('[signup] Failed:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ─── Simple contacts viewer (password-protected) ──────────────────
app.get('/admin/contacts', (req, res) => {
  const pw = process.env.ADMIN_PASSWORD || 'staytrackr-admin';
  const auth = req.headers['authorization'];

  if (!auth || auth !== `Bearer ${pw}`) {
    res.setHeader('WWW-Authenticate', 'Bearer realm="StayTrackr Admin"');
    return res.status(401).send('Unauthorized. Pass ?token=<password> or Authorization: Bearer <password>');
  }

  try {
    const contacts = JSON.parse(fs.readFileSync(CONTACTS_FILE, 'utf8'));
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Contact Submissions</title>
    <style>body{font-family:system-ui,sans-serif;background:#0a0a0a;color:#eee;padding:32px;max-width:900px;margin:0 auto}
    h1{margin-bottom:24px;color:#1FB86E}table{width:100%;border-collapse:collapse;font-size:.85rem}
    th{text-align:left;padding:10px 12px;border-bottom:2px solid #333;color:#888;text-transform:uppercase;font-size:.72rem;letter-spacing:.08em}
    td{padding:12px;border-bottom:1px solid #1a1a1a;vertical-align:top;max-width:300px;word-break:break-word}
    .new{color:#1FB86E;font-weight:700}.ts{color:#555;font-size:.78rem}</style></head>
    <body><h1>📬 Contact Submissions (${contacts.length})</h1>
    <table><tr><th>Date</th><th>Name</th><th>Email</th><th>Subject</th><th>Message</th><th>Device</th><th>Status</th></tr>
    ${contacts.slice().reverse().map(c => `<tr>
      <td class="ts">${new Date(c.timestamp).toLocaleString()}</td>
      <td>${c.name}</td>
      <td>${c.email}</td>
      <td>${c.subject}</td>
      <td>${c.message}</td>
      <td>${c.device || '—'}</td>
      <td class="${c.status === 'new' ? 'new' : ''}">${c.status}</td>
    </tr>`).join('')}
    </table></body></html>`;
    res.send(html);
  } catch {
    res.status(500).send('Error reading contacts.');
  }
});

// ─── Signups admin viewer ─────────────────────────────────────────
app.get('/admin/signups', (req, res) => {
  const pw   = process.env.ADMIN_PASSWORD || 'staytrackr-admin';
  const auth = req.headers['authorization'];
  if (!auth || auth !== `Bearer ${pw}`) {
    res.setHeader('WWW-Authenticate', 'Bearer realm="StayTrackr Admin"');
    return res.status(401).send('Unauthorized.');
  }
  try {
    const signups = JSON.parse(fs.readFileSync(SIGNUPS_FILE, 'utf8'));
    const csv = ['id,email,timestamp,source', ...signups.map(s => `${s.id},${s.email},${s.timestamp},${s.source}`)].join('\n');
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Mailing List</title>
    <style>body{font-family:system-ui,sans-serif;background:#0a0a0a;color:#eee;padding:32px;max-width:800px;margin:0 auto}
    h1{color:#1FB86E;margin-bottom:4px}p{color:#666;margin-bottom:24px}
    table{width:100%;border-collapse:collapse;font-size:.875rem}
    th{text-align:left;padding:10px 12px;border-bottom:2px solid #222;color:#555;text-transform:uppercase;font-size:.72rem;letter-spacing:.08em}
    td{padding:12px;border-bottom:1px solid #181818;color:#ccc}
    .email{color:#fff;font-weight:600}.ts{color:#444;font-size:.78rem}
    a{color:#1FB86E;font-size:.85rem}</style></head>
    <body><h1>📬 Mailing List — ${signups.length} subscribers</h1>
    <p>Sorted newest first · <a href="data:text/csv;charset=utf-8,${encodeURIComponent(csv)}" download="staytrackr-signups.csv">⬇ Download CSV</a></p>
    <table><tr><th>#</th><th>Email</th><th>Date</th><th>Source</th></tr>
    ${signups.slice().reverse().map((s, i) => `<tr>
      <td class="ts">${signups.length - i}</td>
      <td class="email">${s.email}</td>
      <td class="ts">${new Date(s.timestamp).toLocaleString()}</td>
      <td class="ts">${s.source || 'website'}</td>
    </tr>`).join('')}
    </table></body></html>`;
    res.send(html);
  } catch {
    res.status(500).send('Error reading signups.');
  }
});

// ─── Start ────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`StayTrackr website running at http://localhost:${PORT}`);
  console.log(`Contact submissions saved to: ${CONTACTS_FILE}`);
});
