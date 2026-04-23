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
          <a href="mailto:socials@getstaytrackr.com" style="color:#1FB86E;text-decoration:none;">socials@getstaytrackr.com</a>
          &nbsp;·&nbsp;
          <a href="https://getstaytrackr.com/unsubscribe?email=${encodeURIComponent(normalised)}" style="color:#aaa;text-decoration:none;">Unsubscribe</a>
          &nbsp;·&nbsp;
          <a href="https://getstaytrackr.com/privacy" style="color:#aaa;text-decoration:none;">Privacy Policy</a>
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

// ─── Admin login page ─────────────────────────────────────────────
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// ─── Admin dashboard ─────────────────────────────────────────────
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

function adminAuth(req, res) {
  const pw   = process.env.ADMIN_PASSWORD || 'staytrackr-admin';
  const auth = req.headers['authorization'];
  if (!auth || auth !== `Bearer ${pw}`) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

app.get('/admin/api/stats', (req, res) => {
  if (!adminAuth(req, res)) return;
  try {
    const signups  = JSON.parse(fs.readFileSync(SIGNUPS_FILE, 'utf8'));
    const contacts = JSON.parse(fs.readFileSync(CONTACTS_FILE, 'utf8'));
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const thisWeek = signups.filter(s => new Date(s.timestamp).getTime() > oneWeekAgo).length;
    res.json({
      subscribers:      signups.length,
      thisWeek,
      contacts:         contacts.length,
      resendConnected:  !!process.env.RESEND_API_KEY,
    });
  } catch { res.status(500).json({ error: 'Failed to load stats' }); }
});

app.get('/admin/api/subscribers', (req, res) => {
  if (!adminAuth(req, res)) return;
  try {
    const subscribers = JSON.parse(fs.readFileSync(SIGNUPS_FILE, 'utf8'));
    res.json({ subscribers });
  } catch { res.status(500).json({ error: 'Failed to load subscribers' }); }
});

app.get('/admin/api/contacts', (req, res) => {
  if (!adminAuth(req, res)) return;
  try {
    const contacts = JSON.parse(fs.readFileSync(CONTACTS_FILE, 'utf8'));
    res.json({ contacts });
  } catch { res.status(500).json({ error: 'Failed to load contacts' }); }
});

// ─── Test email ───────────────────────────────────────────────────
app.post('/admin/api/test-email', async (req, res) => {
  if (!adminAuth(req, res)) return;
  if (!resend) return res.status(503).json({ error: 'Resend API key not configured. Add RESEND_API_KEY to your environment variables.' });

  const { to } = req.body;
  if (!to || !/\S+@\S+\.\S+/.test(to)) return res.status(400).json({ error: 'Invalid email address.' });

  const from = process.env.RESEND_FROM || 'StayTrackr <onboarding@resend.dev>';
  try {
    const result = await resend.emails.send({
      from,
      to,
      subject: 'Hello World — StayTrackr test email ✅',
      html: `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
      <body style="margin:0;padding:0;background:#f4f4f4;font-family:-apple-system,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
        <tr><td align="center">
          <table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;max-width:520px;width:100%;">
            <tr><td style="background:#080b09;padding:28px 36px;text-align:center;">
              <span style="font-size:24px;">🏠</span>
              <span style="color:#fff;font-size:18px;font-weight:800;vertical-align:middle;margin-left:8px;">StayTrackr</span>
            </td></tr>
            <tr><td style="background:#1FB86E;padding:4px 0;"></td></tr>
            <tr><td style="padding:36px;">
              <h1 style="margin:0 0 16px;font-size:24px;font-weight:800;color:#0d0d0d;">Hello World 👋</h1>
              <p style="margin:0 0 12px;font-size:15px;color:#555;line-height:1.7;">This is a test email from <strong>StayTrackr</strong>.</p>
              <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.7;">If you received this, your Resend integration is working correctly. 🎉</p>
              <p style="font-size:12px;color:#aaa;">Sent via StayTrackr Admin · <a href="https://getstaytrackr.com" style="color:#1FB86E;">getstaytrackr.com</a></p>
            </td></tr>
          </table>
        </td></tr>
      </table></body></html>`,
    });
    console.log(`[test-email] Sent to ${to}`, result);
    res.json({ ok: true, id: result?.data?.id });
  } catch (err) {
    console.error('[test-email] Error:', err);
    res.status(500).json({ error: err.message || 'Failed to send. Check your Resend API key.' });
  }
});

// ─── Broadcast email ──────────────────────────────────────────────
app.post('/admin/api/broadcast', async (req, res) => {
  if (!adminAuth(req, res)) return;
  if (!resend) return res.status(503).json({ error: 'Resend API key not configured. Add RESEND_API_KEY to your environment variables.' });

  const { subject, preview, heading, body, ctaText, ctaUrl } = req.body;
  if (!subject || !heading || !body) return res.status(400).json({ error: 'Subject, heading and body are required.' });

  try {
    const signups = JSON.parse(fs.readFileSync(SIGNUPS_FILE, 'utf8'));
    if (!signups.length) return res.status(400).json({ error: 'No subscribers to send to.' });

    const from = process.env.RESEND_FROM || 'StayTrackr <socials@getstaytrackr.com>';
    let sent = 0;

    for (const s of signups) {
      await resend.emails.send({
        from,
        to: s.email,
        subject,
        headers: { 'List-Unsubscribe': `<mailto:socials@getstaytrackr.com?subject=unsubscribe>` },
        html: broadcastEmailHtml({ heading, body, ctaText, ctaUrl, preview, email: s.email }),
      }).catch(e => console.error(`[broadcast] Failed for ${s.email}:`, e.message));
      sent++;
    }

    console.log(`[broadcast] Sent "${subject}" to ${sent} subscribers`);
    res.json({ ok: true, sent });
  } catch (err) {
    console.error('[broadcast] Error:', err);
    res.status(500).json({ error: 'Broadcast failed. Check server logs.' });
  }
});

function broadcastEmailHtml({ heading, body, ctaText, ctaUrl, preview, email }) {
  const ctaBlock = ctaText && ctaUrl ? `
    <tr><td style="padding:8px 0 32px;">
      <a href="${ctaUrl}" style="display:inline-block;background:#1FB86E;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 28px;border-radius:10px;">${ctaText}</a>
    </td></tr>` : '';
  return `<!DOCTYPE html><html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"/>
${preview ? `<meta name="description" content="${preview}"/>` : ''}</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;max-width:560px;width:100%;">
      <tr><td style="background:#080b09;padding:32px 40px;text-align:center;">
        <span style="font-size:28px;">🏠</span>
        <span style="color:#ffffff;font-size:20px;font-weight:800;letter-spacing:-0.5px;vertical-align:middle;margin-left:8px;">StayTrackr</span>
      </td></tr>
      <tr><td style="background:#1FB86E;padding:5px 0;"></td></tr>
      <tr><td style="padding:40px 40px 8px;">
        <h1 style="margin:0 0 20px;font-size:26px;font-weight:800;color:#0d0d0d;line-height:1.2;">${heading}</h1>
        <table cellpadding="0" cellspacing="0" width="100%">
          <tr><td style="font-size:15px;color:#444;line-height:1.8;">${body}</td></tr>
          ${ctaBlock}
        </table>
      </td></tr>
      <tr><td style="padding:0 40px;"><hr style="border:none;border-top:1px solid #f0f0f0;"/></td></tr>
      <tr><td style="padding:20px 40px;text-align:center;">
        <p style="margin:0;font-size:11px;color:#aaa;line-height:1.7;">
          You're receiving this because you signed up at getstaytrackr.com<br/>
          <a href="mailto:socials@getstaytrackr.com?subject=unsubscribe&body=Please unsubscribe ${encodeURIComponent(email)}" style="color:#aaa;">Unsubscribe</a>
          &nbsp;·&nbsp;
          <a href="https://getstaytrackr.com/privacy" style="color:#aaa;">Privacy Policy</a>
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

// ─── Unsubscribe ──────────────────────────────────────────────────
app.get('/unsubscribe', async (req, res) => {
  const { email, token } = req.query;
  if (!email) return res.redirect('/unsubscribe?error=missing');

  try {
    const signups = JSON.parse(fs.readFileSync(SIGNUPS_FILE, 'utf8'));
    const filtered = signups.filter(s => s.email !== email.toLowerCase().trim());
    fs.writeFileSync(SIGNUPS_FILE, JSON.stringify(filtered, null, 2));

    if (resend && process.env.RESEND_AUDIENCE_ID) {
      const contacts = await resend.contacts.list({ audienceId: process.env.RESEND_AUDIENCE_ID }).catch(() => ({ data: { data: [] } }));
      const contact  = contacts?.data?.data?.find(c => c.email === email);
      if (contact) await resend.contacts.update({ id: contact.id, audienceId: process.env.RESEND_AUDIENCE_ID, unsubscribed: true }).catch(() => {});
    }

    console.log(`[unsubscribe] ${email} unsubscribed`);
    res.send(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Unsubscribed</title>
    <style>body{font-family:system-ui,sans-serif;background:#080b09;color:#eee;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center;}
    .card{background:#0f1411;border:1px solid rgba(255,255,255,.07);border-radius:16px;padding:40px;max-width:400px;}
    h2{font-size:1.5rem;margin-bottom:12px;}p{color:#888;font-size:.9rem;line-height:1.7;margin-bottom:24px;}
    a{color:#1FB86E;text-decoration:none;font-weight:600;}</style></head>
    <body><div class="card">
      <div style="font-size:2.5rem;margin-bottom:16px;">👋</div>
      <h2>You've been unsubscribed</h2>
      <p>We've removed <strong>${email}</strong> from our mailing list. You won't receive any more emails from us.</p>
      <a href="/">← Back to StayTrackr</a>
    </div></body></html>`);
  } catch (err) {
    console.error('[unsubscribe] Error:', err);
    res.status(500).send('Something went wrong. Please email socials@getstaytrackr.com to unsubscribe manually.');
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
