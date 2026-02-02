document.addEventListener('DOMContentLoaded', () => {
  /* =========================
     TOP CAROUSEL — 3 cards + arrows + swipe scroll
  ========================= */

  const top = document.querySelector('[data-reviews-top]');
  if (top) {
    const track = top.querySelector('[data-reviews-top-track]');
    const prev = top.querySelector('[data-reviews-top-prev]');
    const next = top.querySelector('[data-reviews-top-next]');

    const getStep = () => {
      // шаг = ширина одной карточки + gap
      const card = track?.querySelector('.review-mini');
      if (!card) return 320;
      const styles = getComputedStyle(track);
      const gap = parseFloat(styles.columnGap || styles.gap || '0') || 0;
      return card.getBoundingClientRect().width + gap;
    };

    if (prev && track) prev.addEventListener('click', () => track.scrollBy({ left: -getStep(), behavior: 'smooth' }));
    if (next && track) next.addEventListener('click', () => track.scrollBy({ left:  getStep(), behavior: 'smooth' }));
  }

  /* =========================
     FEATURE (Latest 2 comments) — small carousel
  ========================= */

  const feature = document.querySelector('[data-reviews-feature]');
  if (!feature) return;

  const cards = Array.from(feature.querySelectorAll('.review-feature-card'));
  const dotsWrap = feature.querySelector('[data-reviews-feature-dots]');
  const prevBtn = feature.querySelector('[data-reviews-feature-prev]');
  const nextBtn = feature.querySelector('[data-reviews-feature-next]');

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
  const prev = () => go(idx - 1);

  if (prevBtn) prevBtn.addEventListener('click', prev);
  if (nextBtn) nextBtn.addEventListener('click', next);

  makeDots();
  setActive();

  /* автопрокрутка последних 2-х (мягко) */
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

  // пауза при взаимодействии
  feature.addEventListener('mouseenter', stop);
  feature.addEventListener('mouseleave', start);
  feature.addEventListener('touchstart', stop, { passive: true });

  start();
});
