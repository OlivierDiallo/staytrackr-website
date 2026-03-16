// ─── TelemetryDeck Web SDK ────────────────────────────────────────
// App ID shared with the iOS app — all signals appear in one dashboard.

(function () {
  const APP_ID = '8D8C3055-3CF3-49FF-867B-5B223EABA958';

  // Load TelemetryDeck SDK
  const script = document.createElement('script');
  script.src = 'https://cdn.telemetrydeck.com/websdk/telemetrydeck.min.js';
  script.async = true;
  script.onload = function () {
    window.td = new TelemetryDeck({ appID: APP_ID });

    // ── Page view signal ───────────────────────────────────────────
    const page = window.location.pathname === '/'
      ? 'home'
      : window.location.pathname.replace('/', '');

    td.signal('web.pageViewed', { page });

    // ── Section visibility tracking ───────────────────────────────
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          if (id) td.signal('web.sectionViewed', { section: id });
          sectionObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });

    document.querySelectorAll('section[id]').forEach(s => sectionObserver.observe(s));

    // ── Download button clicks ─────────────────────────────────────
    document.querySelectorAll('a[href="#cta"], .btn-primary, .app-store-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        td.signal('web.downloadClicked', {
          label: btn.textContent.trim().slice(0, 50),
          page: window.location.pathname
        });
      });
    });

    // ── Nav link clicks ────────────────────────────────────────────
    document.querySelectorAll('.nav-links a').forEach(link => {
      link.addEventListener('click', () => {
        td.signal('web.navClicked', { label: link.textContent.trim() });
      });
    });

    // ── Pricing plan clicks ────────────────────────────────────────
    document.querySelectorAll('.btn-pricing').forEach(btn => {
      btn.addEventListener('click', () => {
        const plan = btn.closest('.pricing-card')
          ?.querySelector('.pricing-name')?.textContent?.trim() || 'unknown';
        td.signal('web.pricingClicked', { plan });
      });
    });

    // ── Scroll depth ───────────────────────────────────────────────
    const depths = [25, 50, 75, 100];
    const reached = new Set();
    window.addEventListener('scroll', () => {
      const pct = Math.round(
        (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
      );
      depths.forEach(d => {
        if (pct >= d && !reached.has(d)) {
          reached.add(d);
          td.signal('web.scrollDepth', { depth: String(d) });
        }
      });
    }, { passive: true });
  };

  document.head.appendChild(script);
})();
