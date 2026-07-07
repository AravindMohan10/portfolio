(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const targets = document.querySelectorAll(
    '.hero-role, .hero-card, .section-header, .contact-big, nav .logo, .about-lead, .about-photo-caption'
  );

  targets.forEach(function (el) {
    el.classList.add('live-shock');
  });

  function burst() {
    const el = targets[Math.floor(Math.random() * targets.length)];
    if (!el) return;
    el.classList.remove('shock-hit');
    void el.offsetWidth;
    el.classList.add('shock-hit');
  }

  setInterval(burst, 9000 + Math.random() * 6000);
})();
