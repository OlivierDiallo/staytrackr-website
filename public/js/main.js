// ─── Scroll Reveal ────────────────────────────────────────────────
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), i * 90);
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ─── Nav: compact on scroll ───────────────────────────────────────
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 50);
}, { passive: true });

// ─── Animated counters ────────────────────────────────────────────
function animateCounter(el, target, suffix = '', decimals = 0) {
  const duration = 1800;
  const start = performance.now();
  const update = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    const value = ease * target;
    el.textContent = (decimals
      ? value.toFixed(decimals)
      : Math.round(value).toLocaleString()) + suffix;
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      document.querySelectorAll('.stat-item .number[data-value]').forEach(el => {
        const raw      = el.dataset.value;
        const suffix   = el.dataset.suffix || '';
        const decimals = parseInt(el.dataset.decimals || '0');
        animateCounter(el, parseFloat(raw), suffix, decimals);
      });
      statsObserver.disconnect();
    }
  });
}, { threshold: 0.3 });

const statsSection = document.querySelector('#stats');
if (statsSection) statsObserver.observe(statsSection);

// ─── Smooth-scroll for in-page anchors ────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ─── Mailing list signup ──────────────────────────────────────────
(function () {
  // Show live count
  fetch('/signup/count')
    .then(r => r.json())
    .then(({ count }) => {
      const el = document.getElementById('signupCount');
      if (el && count > 0) el.textContent = count.toLocaleString();
    })
    .catch(() => {});

  const form    = document.getElementById('signupForm');
  const input   = document.getElementById('signupEmail');
  const btn     = form && form.querySelector('.btn-signup');
  const success = document.getElementById('signupSuccess');
  const error   = document.getElementById('signupError');

  if (!form) return;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    const email = input.value.trim();
    if (!email) return;

    btn.disabled = true;
    btn.querySelector('.btn-label').hidden = true;
    btn.querySelector('.btn-loading').hidden = false;
    error.hidden = true;

    try {
      const res  = await fetch('/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (res.ok && data.ok) {
        form.querySelector('.signup-row').hidden = true;
        form.querySelector('.signup-note').hidden = true;
        success.hidden = false;
        if (data.count) {
          const el = document.getElementById('signupCount');
          if (el) el.textContent = data.count.toLocaleString();
        }
      } else {
        error.textContent = data.error || 'Something went wrong. Please try again.';
        error.hidden = false;
        btn.disabled = false;
        btn.querySelector('.btn-label').hidden = false;
        btn.querySelector('.btn-loading').hidden = true;
      }
    } catch {
      error.textContent = 'Network error. Please try again.';
      error.hidden = false;
      btn.disabled = false;
      btn.querySelector('.btn-label').hidden = false;
      btn.querySelector('.btn-loading').hidden = true;
    }
  });
})();
