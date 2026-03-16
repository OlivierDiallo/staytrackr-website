// ─── Scroll Reveal ───────────────────────────────────────────────
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), i * 80);
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ─── Smooth nav background on scroll ─────────────────────────────
const nav = document.querySelector('nav');
window.addEventListener('scroll', () => {
  nav.style.background = window.scrollY > 40
    ? 'rgba(10, 15, 13, 0.97)'
    : 'rgba(10, 15, 13, 0.85)';
});

// ─── Animated counters ───────────────────────────────────────────
function animateCounter(el, target, suffix = '', decimals = 0) {
  const duration = 1800;
  const start = performance.now();
  const update = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    const value = ease * target;
    el.textContent = decimals
      ? value.toFixed(decimals) + suffix
      : Math.round(value).toLocaleString() + suffix;
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      document.querySelectorAll('.stat-item .number').forEach(el => {
        const raw = el.dataset.value;
        const suffix = el.dataset.suffix || '';
        const decimals = parseInt(el.dataset.decimals || '0');
        animateCounter(el, parseFloat(raw), suffix, decimals);
      });
      statsObserver.disconnect();
    }
  });
}, { threshold: 0.3 });

const statsSection = document.querySelector('#stats');
if (statsSection) statsObserver.observe(statsSection);

// ─── Property card tabs ──────────────────────────────────────────
document.querySelectorAll('.prop-card').forEach(card => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.prop-card').forEach(c => c.classList.remove('active'));
    card.classList.add('active');
  });
});

// ─── Mobile nav toggle ───────────────────────────────────────────
// (nav links hidden on mobile — could add hamburger here)

// ─── Micro interaction: CTA button pulse on hover ─────────────────
document.querySelectorAll('.btn-primary').forEach(btn => {
  btn.addEventListener('mouseenter', () => {
    btn.style.boxShadow = '0 0 80px rgba(31,184,110,0.6)';
  });
  btn.addEventListener('mouseleave', () => {
    btn.style.boxShadow = '0 0 40px rgba(31,184,110,0.35)';
  });
});
