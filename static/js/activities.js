document.addEventListener('DOMContentLoaded', () => {
  const modal = document.querySelector('[data-activity-modal]');
  if (!modal) return;

  /* Перенос в body гарантирует слой выше хедера и остальных секций. */
  document.body.appendChild(modal);

  const title = modal.querySelector('[data-activity-modal-title]');
  const category = modal.querySelector('[data-activity-modal-category]');
  const description = modal.querySelector('[data-activity-modal-description]');
  const gallery = modal.querySelector('[data-activity-gallery]');
  const image = modal.querySelector('[data-activity-modal-image]');
  const incoming = modal.querySelector('[data-activity-modal-image-incoming]');
  const counter = modal.querySelector('[data-activity-counter]');
  const dots = modal.querySelector('[data-activity-dots]');
  const prev = modal.querySelector('[data-activity-prev]');
  const next = modal.querySelector('[data-activity-next]');
  const closeElements = modal.querySelectorAll('[data-activity-modal-close]');
  const contactLink = modal.querySelector('.activity-modal__book');

  let photos = [];
  let activeIndex = 0;
  let transitionId = 0;
  let touchStartX = 0;
  let touchStartY = 0;
  let touchDeltaX = 0;
  let horizontalSwipe = false;

  const nextIndex = () => (activeIndex + 1) % Math.max(1, photos.length);
  const prevIndex = () => (activeIndex - 1 + photos.length) % Math.max(1, photos.length);

  const updateUi = () => {
    if (counter) counter.textContent = `${activeIndex + 1} / ${Math.max(1, photos.length)}`;

    if (dots) {
      dots.querySelectorAll('.activity-modal__dot').forEach((dot, index) => {
        dot.classList.toggle('is-active', index === activeIndex);
      });
    }
  };

  const crossfade = (src) => {
    if (!image || !incoming || !src) return;

    if (!image.getAttribute('src')) {
      image.src = src;
      return;
    }

    const currentTransition = ++transitionId;
    const loader = new Image();
    loader.src = src;

    const reveal = () => {
      if (currentTransition !== transitionId) return;

      incoming.classList.add('no-transition');
      incoming.classList.remove('is-visible');
      incoming.src = src;

      window.requestAnimationFrame(() => {
        incoming.classList.remove('no-transition');
        window.requestAnimationFrame(() => {
          if (currentTransition !== transitionId) return;
          incoming.classList.add('is-visible');

          window.setTimeout(() => {
            if (currentTransition !== transitionId) return;
            image.src = src;
            incoming.classList.add('no-transition');
            incoming.classList.remove('is-visible');
            window.requestAnimationFrame(() => incoming.classList.remove('no-transition'));
          }, 280);
        });
      });
    };

    if (loader.complete) reveal();
    else {
      loader.onload = reveal;
      loader.onerror = reveal;
    }
  };

  const showPhoto = (index) => {
    if (!photos[index]) return;
    activeIndex = index;
    crossfade(photos[activeIndex]);
    updateUi();
  };

  const renderDots = () => {
    if (!dots) return;
    dots.innerHTML = '';

    photos.forEach((_, index) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = `activity-modal__dot${index === 0 ? ' is-active' : ''}`;
      dot.setAttribute('aria-label', `Показать фото ${index + 1}`);
      dot.addEventListener('click', () => showPhoto(index));
      dots.appendChild(dot);
    });
  };

  const openModal = (card) => {
    photos = (card.dataset.activityImages || '')
      .split(',')
      .map((src) => src.trim())
      .filter(Boolean);

    if (!photos.length) return;

    activeIndex = 0;
    transitionId += 1;

    photos.forEach((src) => {
      const preload = new Image();
      preload.src = src;
    });

    if (title) title.textContent = card.dataset.activityTitle || 'Активность';
    if (category) category.textContent = card.dataset.activityCategory || 'Впечатления';

    const cardDescription = card.querySelector('[data-activity-description]');
    if (description) description.innerHTML = cardDescription ? cardDescription.innerHTML : '';

    if (image) image.src = photos[0];
    if (incoming) {
      incoming.src = '';
      incoming.classList.remove('is-visible', 'no-transition');
    }

    renderDots();
    updateUi();

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('activity-modal-open');

    const body = modal.querySelector('.activity-modal__body');
    if (body) body.scrollTop = 0;
  };

  const closeModal = () => {
    transitionId += 1;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('activity-modal-open');

    photos = [];
    activeIndex = 0;
    if (image) image.src = '';
    if (incoming) incoming.src = '';
    if (dots) dots.innerHTML = '';
  };

  document.querySelectorAll('[data-activity-card]').forEach((card) => {
    card.addEventListener('click', () => openModal(card));
  });

  if (prev) prev.addEventListener('click', () => showPhoto(prevIndex()));
  if (next) next.addEventListener('click', () => showPhoto(nextIndex()));

  closeElements.forEach((element) => element.addEventListener('click', closeModal));
  if (contactLink) contactLink.addEventListener('click', closeModal);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
  });

  /* Свайп фотографий на телефоне без блокировки вертикального скролла. */
  if (gallery) {
    gallery.addEventListener(
      'touchstart',
      (event) => {
        const touch = event.touches[0];
        if (!touch) return;
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        touchDeltaX = 0;
        horizontalSwipe = false;
      },
      { passive: true }
    );

    gallery.addEventListener(
      'touchmove',
      (event) => {
        const touch = event.touches[0];
        if (!touch) return;

        const deltaX = touch.clientX - touchStartX;
        const deltaY = touch.clientY - touchStartY;
        touchDeltaX = deltaX;

        if (Math.abs(deltaX) > 10 && Math.abs(deltaX) > Math.abs(deltaY)) {
          horizontalSwipe = true;
          event.preventDefault();
        }
      },
      { passive: false }
    );

    gallery.addEventListener('touchend', () => {
      if (horizontalSwipe && Math.abs(touchDeltaX) >= 45) {
        showPhoto(touchDeltaX < 0 ? nextIndex() : prevIndex());
      }
      touchDeltaX = 0;
      horizontalSwipe = false;
    });

    gallery.addEventListener('touchcancel', () => {
      touchDeltaX = 0;
      horizontalSwipe = false;
    });
  }
});
