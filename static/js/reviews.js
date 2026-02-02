document.addEventListener('DOMContentLoaded', () => {
  /* =========================
     REVIEWS — CAROUSEL (fade) + autoplay + swipe
  ========================= */

  const root = document.querySelector('[data-reviews]');
  if (!root) return;

  const track = root.querySelector('[data-reviews-track]');
  const dotsWrap = root.querySelector('[data-reviews-dots]');
  if (!track || !dotsWrap) return;

  const slides = Array.from(track.querySelectorAll('[data-review-slide]'));
  if (!slides.length) return;

  let active = Math.max(0, slides.findIndex(s => s.classList.contains('is-active')));
  if (active === -1) active = 0;

  // скорость/логика автоплея (мс = миллисекунды)
  const AUTOPLAY_MS = 4500;       // <-- меняешь тут скорость
  const RESUME_IDLE_MS = 3500;    // <-- через сколько без действий снова авто
  let autoplayTimer = null;
  let resumeTimer = null;
  let userPaused = false;

  const setActive = (idx) => {
    active = (idx + slides.length) % slides.length;
    slides.forEach((s, i) => s.classList.toggle('is-active', i === active));

    const dots = dotsWrap.querySelectorAll('.reviews-dot');
    dots.forEach((d, i) => d.classList.toggle('is-active', i === active));
  };

  const markUserInteraction = () => {
    userPaused = true;
    stopAutoplay(false);

    window.clearTimeout(resumeTimer);
    resumeTimer = window.setTimeout(() => {
      userPaused = false;
      startAutoplay();
    }, RESUME_IDLE_MS);
  };

  const startAutoplay = () => {
    if (autoplayTimer) return;
    if (slides.length <= 1) return;
    if (userPaused) return;

    autoplayTimer = window.setInterval(() => {
      setActive(active + 1);
    }, AUTOPLAY_MS);
  };

  const stopAutoplay = (clearResume) => {
    if (autoplayTimer) {
      window.clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
    if (clearResume) {
      window.clearTimeout(resumeTimer);
      resumeTimer = null;
    }
  };

  // dots build
  dotsWrap.innerHTML = '';
  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'reviews-dot' + (i === active ? ' is-active' : '');
    dot.addEventListener('click', () => {
      markUserInteraction();
      setActive(i);
    });
    dotsWrap.appendChild(dot);
  });

  setActive(active);
  startAutoplay();

  // swipe (mobile)
  let startX = 0;
  let endX = 0;
  const SWIPE_THRESHOLD = 45;

  track.addEventListener('touchstart', (e) => {
    startX = e.changedTouches[0].screenX;
  }, { passive: true });

  track.addEventListener('touchend', (e) => {
    endX = e.changedTouches[0].screenX;
    const dx = endX - startX;
    if (Math.abs(dx) < SWIPE_THRESHOLD) return;

    markUserInteraction();
    if (dx < 0) setActive(active + 1);
    else setActive(active - 1);
  }, { passive: true });

  // если человек тыкает по блоку — это считается взаимодействием
  root.addEventListener('mousedown', markUserInteraction);
});
