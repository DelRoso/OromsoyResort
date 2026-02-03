document.addEventListener('DOMContentLoaded', () => {
  /* =========================
     TOP CAROUSEL — ALL REVIEWS
     - autoplay всегда
     - стрелки скрыты во время autoplay
     - клик/тап по карусели → стоп + стрелки появляются
     - если не трогать — снова autoplay
  ========================= */

  const top = document.querySelector('[data-reviews-top]');
  if (top) {
    const track = top.querySelector('[data-reviews-top-track]');
    const prev = top.querySelector('[data-reviews-top-prev]');
    const next = top.querySelector('[data-reviews-top-next]');
    const cards = track ? Array.from(track.querySelectorAll('.review-mini')) : [];

    const AUTOPLAY_MS = 2200;     // скорость автокрутки (мс)
    const RESUME_IDLE_MS = 4000;  // через сколько без действий снова включать автоплей

    let autoplayTimer = null;
    let resumeTimer = null;
    let userPaused = false;

    const getStep = () => {
      const card = track?.querySelector('.review-mini');
      if (!card) return 320;
      const styles = getComputedStyle(track);
      const gap = parseFloat(styles.columnGap || styles.gap || '0') || 0;
      return card.getBoundingClientRect().width + gap;
    };

    const setAutoplayUI = (isAutoplay) => {
      top.classList.toggle('is-autoplay', isAutoplay);
    };

    const startAutoplay = () => {
      if (!track) return;
      if (cards.length <= 1) return;
      if (autoplayTimer) return;
      if (userPaused) return;

      setAutoplayUI(true);
      autoplayTimer = window.setInterval(() => {
        track.scrollBy({ left: getStep(), behavior: 'smooth' });

        // если дошли до конца — мягко вернемся в начало
        const maxScroll = track.scrollWidth - track.clientWidth;
        if (track.scrollLeft >= maxScroll - 2) {
          window.setTimeout(() => {
            track.scrollTo({ left: 0, behavior: 'smooth' });
          }, 250);
        }
      }, AUTOPLAY_MS);
    };

    const stopAutoplay = (clearResume = false) => {
      if (autoplayTimer) {
        window.clearInterval(autoplayTimer);
        autoplayTimer = null;
      }
      setAutoplayUI(false);

      if (clearResume) {
        window.clearTimeout(resumeTimer);
        resumeTimer = null;
      }
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

    // arrows: листают и считаются взаимодействием
    if (prev && track) {
      prev.addEventListener('click', (e) => {
        e.preventDefault();
        markUserInteraction();
        track.scrollBy({ left: -getStep(), behavior: 'smooth' });
      });
    }

    if (next && track) {
      next.addEventListener('click', (e) => {
        e.preventDefault();
        markUserInteraction();
        track.scrollBy({ left: getStep(), behavior: 'smooth' });
      });
    }

    // тап/клик по карусели — остановка и ручной режим
    if (track) {
      track.addEventListener('click', () => markUserInteraction());
      track.addEventListener('touchstart', () => markUserInteraction(), { passive: true });

      // если человек скроллит пальцем/мышью — тоже считаем
      let scrollDebounce = null;
      track.addEventListener('scroll', () => {
        window.clearTimeout(scrollDebounce);
        scrollDebounce = window.setTimeout(() => {
          markUserInteraction();
        }, 120);
      });
    }

    // стартуем сразу
    startAutoplay();
  }

  /* =========================
     FEATURE (Latest 2 comments)
     - стрелки скрыты через CSS
     - автопереключение + точки
  ========================= */

  const feature = document.querySelector('[data-reviews-feature]');
  if (!feature) return;

  const cards = Array.from(feature.querySelectorAll('.review-feature-card'));
  const dotsWrap = feature.querySelector('[data-reviews-feature-dots]');

  if (!cards.length) return;

  let idx = Math.max(0, cards.findIndex(c => c.classList.contains('is-active')));
  if (idx < 0) idx = 0;

  const makeDots = () => {
    if (!dotsWrap) return;

    dotsWrap.innerHTML = '';
    cards.forEach((_, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'reviews-feature-dot' + (i === idx ? ' is-active' : '');
      b.addEventListener('click', () => go(i));
      dotsWrap.appendChild(b);
    });
  };

  const setActive = () => {
    cards.forEach((c, i) => c.classList.toggle('is-active', i === idx));
    if (!dotsWrap) return;
    const dots = dotsWrap.querySelectorAll('.reviews-feature-dot');
    dots.forEach((d, i) => d.classList.toggle('is-active', i === idx));
  };

  const go = (nextIndex) => {
    idx = (nextIndex + cards.length) % cards.length;
    setActive();
  };

  const next = () => go(idx + 1);

  makeDots();
  setActive();

  const AUTOPLAY_MS = 3500;
  let timer = null;

  const start = () => {
    if (cards.length <= 1) return;
    if (timer) return;
    timer = window.setInterval(next, AUTOPLAY_MS);
  };

  const stop = () => {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
  };

  feature.addEventListener('mouseenter', stop);
  feature.addEventListener('mouseleave', start);
  feature.addEventListener('touchstart', stop, { passive: true });

  start();
});
