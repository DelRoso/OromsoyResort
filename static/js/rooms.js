document.addEventListener('DOMContentLoaded', () => {
  /* =========================
     ROOMS — SLIDER (твоя логика, НЕ ЛОМАЛ)
  ========================= */

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
  next.addEventListener('click', () => track.scrollBy({ left: getCardWidth(), behavior: 'smooth' }));

  /* =========================
     ROOMS — MODAL / GALLERY + AUTOCAROUSEL + FULLSCREEN
  ========================= */

  const modal = document.querySelector('[data-room-modal]');
  if (!modal) return;

  const modalTitle = modal.querySelector('[data-room-modal-title]');
  const modalPrice = modal.querySelector('[data-room-modal-price]');
  const modalTrack = modal.querySelector('[data-room-modal-track]');
  const dotsWrap = modal.querySelector('[data-room-modal-dots]');
  const modalPrev = modal.querySelector('[data-room-modal-prev]');
  const modalNext = modal.querySelector('[data-room-modal-next]');
  const closeEls = modal.querySelectorAll('[data-room-modal-close]');

  // fullscreen overlay
  const fs = modal.querySelector('[data-room-fs]');
  const fsImg = modal.querySelector('[data-room-fs-img]');
  const fsCloseEls = modal.querySelectorAll('[data-room-fs-close]');
  const fsPrev = modal.querySelector('[data-room-fs-prev]');
  const fsNext = modal.querySelector('[data-room-fs-next]');

  let slides = [];
  let activeIndex = 0;

  // autoplay state
  const AUTOPLAY_MS = 1000; // скорость автокарусели (мс)
  const RESUME_IDLE_MS = 1500; // через сколько без действий снова включать автоплей (мс)
  let autoplayInterval = null;
  let resumeTimeout = null;
  let userPaused = false;

  const isOpen = () => modal.classList.contains('is-open');
  const isFsOpen = () => fs && fs.classList.contains('is-open');

  const openModal = () => {
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');

    // FIX: при открытии карточки скрываем хедер через CSS (body.modal-open .site-header { ... })
    document.body.classList.add('modal-open');

    startAutoplay(); // по дефолту автокарусель включена
  };

  const closeModal = () => {
    stopAutoplay(true);
    closeFullscreen();

    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');

    // FIX: возвращаем хедер обратно
    document.body.classList.remove('modal-open');

    modalTrack.innerHTML = '';
    dotsWrap.innerHTML = '';
    slides = [];
    activeIndex = 0;
  };

  /* =========================
     FULLSCREEN — render/open/close + paging
  ========================= */

  const renderFs = () => {
    if (!fs || !fsImg) return;
    if (!slides[activeIndex]) return;

    const imgEl = slides[activeIndex].querySelector('img');
    if (!imgEl) return;

    fsImg.src = imgEl.src;
  };

  const openFullscreen = () => {
    if (!fs || !fsImg) return;
    fs.classList.add('is-open');
    fs.setAttribute('aria-hidden', 'false');
    renderFs();
  };

  const closeFullscreen = () => {
    if (!fs || !fsImg) return;
    fs.classList.remove('is-open');
    fs.setAttribute('aria-hidden', 'true');
    fsImg.src = '';
  };

  // fullscreen close (крестик + фон)
  fsCloseEls.forEach((el) => el.addEventListener('click', closeFullscreen));

  /* =========================
     CORE — dots/scroll helpers
  ========================= */

  const setActiveDot = (idx) => {
    const dots = dotsWrap.querySelectorAll('.room-modal__dot');
    dots.forEach((d, i) => d.classList.toggle('is-active', i === idx));
  };

  const scrollToIndex = (idx, behavior = 'smooth') => {
    if (!slides[idx]) return;
    activeIndex = idx;

    const el = slides[idx];
    modalTrack.scrollTo({ left: el.offsetLeft, behavior });
    setActiveDot(idx);

    // если fullscreen открыт — синхронизируем картинку
    if (isFsOpen()) renderFs();
  };

  const nextIndex = () => (activeIndex + 1) % Math.max(1, slides.length);
  const prevIndex = () => (activeIndex - 1 + slides.length) % Math.max(1, slides.length);

  /* =========================
     AUTOPLAY — твоя логика, но с синхрой fullscreen
  ========================= */

  const markUserInteraction = () => {
    // пользователь начал управлять — ставим на паузу
    userPaused = true;
    stopAutoplay(false);

    // после простоя снова включаем автоплей
    window.clearTimeout(resumeTimeout);
    resumeTimeout = window.setTimeout(() => {
      userPaused = false;
      if (isOpen()) startAutoplay();
    }, RESUME_IDLE_MS);
  };

  const startAutoplay = () => {
    if (autoplayInterval || slides.length <= 1) return;
    if (userPaused) return;

    autoplayInterval = window.setInterval(() => {
      if (!isOpen()) return;
      scrollToIndex(nextIndex(), 'smooth');
    }, AUTOPLAY_MS);
  };

  const stopAutoplay = (clearResumeTimer) => {
    if (autoplayInterval) {
      window.clearInterval(autoplayInterval);
      autoplayInterval = null;
    }
    if (clearResumeTimer) {
      window.clearTimeout(resumeTimeout);
      resumeTimeout = null;
    }
  };

  /* =========================
     BUILD MODAL
  ========================= */

  const rebuildModal = ({ title, price, images }) => {
    if (modalTitle) modalTitle.textContent = title || 'ROOM';
    if (modalPrice) modalPrice.textContent = price || '';

    modalTrack.innerHTML = '';
    dotsWrap.innerHTML = '';
    slides = [];

    images.forEach((src, i) => {
      const slide = document.createElement('div');
      slide.className = 'room-modal__img';
      slide.innerHTML = `<img src="${src}" alt="${title || 'Room photo'}">`;

      // fullscreen по клику на фото
      slide.querySelector('img').addEventListener('click', (e) => {
        e.stopPropagation();
        markUserInteraction(); // клик — это действие
        openFullscreen();
      });

      modalTrack.appendChild(slide);
      slides.push(slide);

      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'room-modal__dot' + (i === 0 ? ' is-active' : '');
      dot.addEventListener('click', () => {
        markUserInteraction();
        scrollToIndex(i);
      });
      dotsWrap.appendChild(dot);
    });

    activeIndex = 0;
    modalTrack.scrollTo({ left: 0, behavior: 'auto' });
    setActiveDot(0);

    // сброс режимов автоплея при открытии
    userPaused = false;
    stopAutoplay(true);
  };

  // трекинг активного слайда по скроллу (и это считается действием пользователя)
  let scrollTimer = null;
  modalTrack.addEventListener('scroll', () => {
    if (!slides.length) return;

    // если пользователь скроллит руками — ставим паузу
    markUserInteraction();

    window.clearTimeout(scrollTimer);
    scrollTimer = window.setTimeout(() => {
      const trackLeft = modalTrack.scrollLeft;

      let best = 0;
      let bestDist = Infinity;
      slides.forEach((s, i) => {
        const dist = Math.abs(s.offsetLeft - trackLeft);
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      });

      activeIndex = best;
      setActiveDot(best);

      // синхра fullscreen, если он открыт
      if (isFsOpen()) renderFs();
    }, 80);
  });

  // кнопки модалки
  if (modalPrev) {
    modalPrev.addEventListener('click', () => {
      markUserInteraction();
      scrollToIndex(prevIndex());
    });
  }

  if (modalNext) {
    modalNext.addEventListener('click', () => {
      markUserInteraction();
      scrollToIndex(nextIndex());
    });
  }

  // кнопки fullscreen prev/next (если есть в HTML)
  if (fsPrev) {
    fsPrev.addEventListener('click', () => {
      markUserInteraction();
      scrollToIndex(prevIndex());
      renderFs();
    });
  }

  if (fsNext) {
    fsNext.addEventListener('click', () => {
      markUserInteraction();
      scrollToIndex(nextIndex());
      renderFs();
    });
  }

  // закрытие модалки
  closeEls.forEach((el) => el.addEventListener('click', closeModal));

  // клавиатура
  document.addEventListener('keydown', (e) => {
    // fullscreen режим
    if (isFsOpen()) {
      if (e.key === 'Escape') closeFullscreen();
      if (e.key === 'ArrowLeft') {
        markUserInteraction();
        scrollToIndex(prevIndex());
        renderFs();
      }
      if (e.key === 'ArrowRight') {
        markUserInteraction();
        scrollToIndex(nextIndex());
        renderFs();
      }
      return;
    }

    // обычная модалка
    if (!isOpen()) return;

    if (e.key === 'Escape') closeModal();
    if (e.key === 'ArrowLeft') {
      markUserInteraction();
      scrollToIndex(prevIndex());
    }
    if (e.key === 'ArrowRight') {
      markUserInteraction();
      scrollToIndex(nextIndex());
    }
  });

  /* =========================
     ROOMS — OPEN MODAL ON CARD CLICK
  ========================= */

  document.querySelectorAll('.room-slide[data-images]').forEach((card) => {
    card.addEventListener('click', () => {
      const title =
        card.getAttribute('data-room-title') ||
        card.querySelector('.room-name')?.textContent?.trim() ||
        'ROOM';

      const price =
        card.getAttribute('data-room-price') ||
        card.querySelector('.room-price')?.textContent?.trim() ||
        '';

      const imagesRaw = card.getAttribute('data-images') || '';
      const images = imagesRaw.split(',').map((s) => s.trim()).filter(Boolean);
      if (!images.length) return;

      rebuildModal({ title, price, images });
      openModal();
    });
  });

  // когда модалка открылась — запускаем автоплей (если пользователь не трогает)
  const observer = new MutationObserver(() => {
    if (isOpen()) startAutoplay();
  });
  observer.observe(modal, { attributes: true, attributeFilter: ['class'] });

  /* =========================
     FULLSCREEN — TOUCH SWIPE (MOBILE)
  ========================= */

  let fsTouchStartX = 0;
  let fsTouchEndX = 0;
  const FS_SWIPE_THRESHOLD = 40; // px, чувствительность свайпа

  if (fs) {
    fs.addEventListener(
      'touchstart',
      (e) => {
        if (!isFsOpen()) return;
        fsTouchStartX = e.changedTouches[0].screenX;
      },
      { passive: true }
    );

    fs.addEventListener('touchend', (e) => {
      if (!isFsOpen()) return;
      fsTouchEndX = e.changedTouches[0].screenX;
      handleFsSwipe();
    });
  }

  const handleFsSwipe = () => {
    const deltaX = fsTouchEndX - fsTouchStartX;

    if (Math.abs(deltaX) < FS_SWIPE_THRESHOLD) return;

    markUserInteraction();

    if (deltaX < 0) {
      // свайп влево → next
      scrollToIndex(nextIndex());
      renderFs();
    } else {
      // свайп вправо → prev
      scrollToIndex(prevIndex());
      renderFs();
    }
  };
});
