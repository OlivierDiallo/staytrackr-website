const express = require('express');
const path    = require('path');
const fs      = require('fs');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── Data directory ───────────────────────────────────────────────
const DATA_DIR      = path.join(__dirname, 'data');
const CONTACTS_FILE = path.join(DATA_DIR, 'contacts.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(CONTACTS_FILE)) fs.writeFileSync(CONTACTS_FILE, '[]');

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

// ─── Start ────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`StayTrackr website running at http://localhost:${PORT}`);
  console.log(`Contact submissions saved to: ${CONTACTS_FILE}`);
});
