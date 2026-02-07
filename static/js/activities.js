document.addEventListener('DOMContentLoaded', () => {
  const root = document.querySelector('[data-activities]');
  if (!root) return;

  const slides = Array.from(root.querySelectorAll('.activities-slide'));
  const dotsWrap = root.querySelector('[data-activities-dots]');
  const prevBtn = root.querySelector('[data-activities-prev]');
  const nextBtn = root.querySelector('[data-activities-next]');
  if (!slides.length) return;

  let idx = slides.findIndex(s => s.classList.contains('is-active'));
  if (idx < 0) idx = 0;

  const AUTOPLAY_MS = 3500;
  const RESUME_IDLE_MS = 6000;
  let timer = null;
  let resumeTimer = null;
  let pausedByUser = false;

  const setActive = (n) => {
    idx = (n + slides.length) % slides.length;
    slides.forEach((s, i) => s.classList.toggle('is-active', i === idx));
    if (dotsWrap) {
      const dots = dotsWrap.querySelectorAll('.activities-dot');
      dots.forEach((d, i) => d.classList.toggle('is-active', i === idx));
    }
  };

  const next = () => setActive(idx + 1);
  const prev = () => setActive(idx - 1);

  const stop = (clearResume = false) => {
    if (timer) { clearInterval(timer); timer = null; }
    if (clearResume && resumeTimer) { clearTimeout(resumeTimer); resumeTimer = null; }
  };

  const start = () => {
    if (timer || slides.length <= 1) return;
    if (pausedByUser) return;
    timer = setInterval(next, AUTOPLAY_MS);
  };

  const userAction = () => {
    pausedByUser = true;
    stop(false);

    clearTimeout(resumeTimer);
    resumeTimer = setTimeout(() => {
      pausedByUser = false;
      start();
    }, RESUME_IDLE_MS);
  };

  // dots
  if (dotsWrap) {
    dotsWrap.innerHTML = '';
    slides.forEach((_, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'activities-dot' + (i === idx ? ' is-active' : '');
      b.addEventListener('click', () => {
        userAction();
        setActive(i);
      });
      dotsWrap.appendChild(b);
    });
  }

  // arrows
  if (prevBtn) prevBtn.addEventListener('click', () => { userAction(); prev(); });
  if (nextBtn) nextBtn.addEventListener('click', () => { userAction(); next(); });

  // swipe (mobile)
  let startX = 0;
  const TH = 40;

  root.addEventListener('touchstart', (e) => {
    startX = e.changedTouches[0].screenX;
  }, { passive: true });

  root.addEventListener('touchend', (e) => {
    const endX = e.changedTouches[0].screenX;
    const dx = endX - startX;
    if (Math.abs(dx) < TH) return;
    userAction();
    if (dx < 0) next();
    else prev();
  });

  // init
  setActive(idx);
  start();
});
