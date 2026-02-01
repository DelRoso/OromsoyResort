document.addEventListener('DOMContentLoaded', () => {
  const slider = document.querySelector('[data-rooms-slider]');
  if (!slider) return;

  const track = slider.querySelector('[data-rooms-track]');
  const prev = slider.querySelector('[data-rooms-prev]');
  const next = slider.querySelector('[data-rooms-next]');
  if (!track || !prev || !next) return;

  const getCardWidth = () => {
    const card = track.querySelector('.room-slide');
    if (!card) return 320;
    const styles = getComputedStyle(track);
    const gap = parseFloat(styles.columnGap || styles.gap || '0') || 0;
    return card.getBoundingClientRect().width + gap;
  };

  prev.addEventListener('click', () => track.scrollBy({ left: -getCardWidth(), behavior: 'smooth' }));
  next.addEventListener('click', () => track.scrollBy({ left:  getCardWidth(), behavior: 'smooth' }));
});
