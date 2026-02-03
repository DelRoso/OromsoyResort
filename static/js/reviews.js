document.addEventListener('DOMContentLoaded', () => {
  /* =========================
     REVIEWS — TOP (ALL REVIEWS carousel)
     Требования:
     - автопрокрутка работает всегда по дефолту
     - стрелки скрыты, пока автоплей активен
     - если пользователь кликнул/скролл... → пауза + стрелки появляются
     - если пользователь не трогает → автоплей включается обратно и стрелки пропадают
  ========================= */

  const top = document.querySelector('[data-reviews-top]');
  if (top) {
    const track = top.querySelector('[data-reviews-top-track]');
    const prev = top.querySelector('[data-reviews-top-prev]');
    const next = top.querySelector('[data-reviews-top-next]');

    if (track) {
      const getStep = () => {
        const card = track.querySelector('.review-mini');
        if (!card) return 360;

        const styles = getComputedStyle(track);
        const gap = parseFloat(styles.columnGap || styles.gap || '0') || 0;
        return card.getBoundingClientRect().width + gap;
      };

      // ---- autoplay/pause logic ----
      const AUTOPLAY_MS = 2200;       // скорость автопрокрутки (мс)
      const RESUME_IDLE_MS = 5500;    // через сколько без действий снова включать автоплей (мс)

      let interval = null;
      let resumeTimer = null;
      let paused = false;

      const setPaused = (val) => {
        paused = val;
        top.classList.toggle('is-paused', paused);

        if (paused) {
          stopAutoplay();
        } else {
          startAutoplay();
        }
      };

      const stopAutoplay = () => {
        if (interval) {
          clearInterval(interval);
          interval = null;
        }
      };

      const scheduleResume = () => {
        clearTimeout(resumeTimer);
        resumeTimer = setTimeout(() => setPaused(false), RESUME_IDLE_MS);
      };

      const markInteraction = () => {
        // пользователь тронул — ставим паузу и показываем стрелки
        if (!paused) setPaused(true);
        scheduleResume();
      };

      const scrollNext = (behavior = 'smooth') => {
        const step = getStep();

        // если дошли до конца — возвращаемся в начало
        const maxScroll = track.scrollWidth - track.clientWidth;
        const nearEnd = track.scrollLeft >= maxScroll - 2;

        if (nearEnd) {
          track.scrollTo({ left: 0, behavior });
        } else {
          track.scrollBy({ left: step, behavior });
        }
      };

      const scrollPrev = (behavior = 'smooth') => {
        const step = getStep();

        // если в начале — прыгаем в конец
        const maxScroll = track.scrollWidth - track.clientWidth;
        const nearStart = track.scrollLeft <= 2;

        if (nearStart) {
          track.scrollTo({ left: maxScroll, behavior });
        } else {
          track.scrollBy({ left: -step, behavior });
        }
      };

      const startAutoplay = () => {
        if (interval) return;

        const cardsCount = track.querySelectorAll('.review-mini').length;
        if (cardsCount <= 3) return; // если карточек мало — автоплей не нужен

        interval = setInterval(() => {
          if (paused) return;
          scrollNext('smooth');
        }, AUTOPLAY_MS);
      };

      // ---- events ----
      prev?.addEventListener('click', () => {
        markInteraction();
        scrollPrev('smooth');
      });

      next?.addEventListener('click', () => {
        markInteraction();
        scrollNext('smooth');
      });

      // клик по ленте — пауза
      track.addEventListener('click', () => {
        markInteraction();
      });

      // ручной скролл/свайп по ленте — пауза
      let scrollDebounce = null;
      track.addEventListener('scroll', () => {
        // чтобы не дёргать на каждом пикселе
        clearTimeout(scrollDebounce);
        scrollDebounce = setTimeout(() => {
          markInteraction();
        }, 80);
      });

      // запуск по дефолту
      setPaused(false);
      startAutoplay();
    }
  }

  /* =========================
     REVIEWS — FEATURE (LATEST COMMENTS)
     (стрелки в CSS скрыты, но логика пусть остаётся — на будущее)
  ========================= */

  const feature = document.querySelector('[data-review-feature]');
  if (feature) {
    const slides = feature.querySelectorAll('[data-review-slide]');
    const dotsWrap = feature.querySelector('[data-review-dots]');
    const prevBtn = feature.querySelector('[data-review-prev]');
    const nextBtn = feature.querySelector('[data-review-next]');

    let index = 0;
    let timer = null;
    const AUTOPLAY = 4000;

    const setActive = (i) => {
      slides.forEach((s, idx) => s.classList.toggle('is-active', idx === i));
      if (dotsWrap) {
        const dots = dotsWrap.querySelectorAll('.reviews-dot');
        dots.forEach((d, idx) => d.classList.toggle('is-active', idx === i));
      }
      index = i;
    };

    const next = () => setActive((index + 1) % slides.length);
    const prev = () => setActive((index - 1 + slides.length) % slides.length);

    const buildDots = () => {
      if (!dotsWrap) return;
      dotsWrap.innerHTML = '';
      slides.forEach((_, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'reviews-dot' + (i === 0 ? ' is-active' : '');
        b.addEventListener('click', () => {
          stop();
          setActive(i);
        });
        dotsWrap.appendChild(b);
      });
    };

    const start = () => {
      if (slides.length <= 1) return;
      if (timer) return;
      timer = setInterval(next, AUTOPLAY);
    };

    const stop = () => {
      if (!timer) return;
      clearInterval(timer);
      timer = null;
    };

    prevBtn?.addEventListener('click', () => { stop(); prev(); });
    nextBtn?.addEventListener('click', () => { stop(); next(); });

    buildDots();
    setActive(0);
    start();
  }
});
