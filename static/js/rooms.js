document.addEventListener('DOMContentLoaded', () => {
  /* =========================================================
     ГОРИЗОНТАЛЬНЫЕ СЛАЙДЕРЫ КАРТОЧЕК НОМЕРОВ
  ========================================================= */
  document.querySelectorAll('[data-rooms-slider]').forEach((slider) => {
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

    prev.addEventListener('click', () => {
      track.scrollBy({ left: -getCardWidth(), behavior: 'smooth' });
    });

    next.addEventListener('click', () => {
      track.scrollBy({ left: getCardWidth(), behavior: 'smooth' });
    });
  });

  /* =========================================================
     МОДАЛЬНОЕ ОКНО НОМЕРА

     В модалке остался один экран: фотография и информация.
     Отдельная внутренняя страница галереи больше не используется.
  ========================================================= */
  const modal = document.querySelector('[data-room-modal]');
  if (!modal) return;

  /*
    Переносим модалку в body.
    Иначе stacking context секции rooms не позволяет ей подняться
    выше фиксированного хедера даже при большом z-index.
  */
  document.body.appendChild(modal);

  const modalTitle = modal.querySelector('[data-room-modal-title]');
  const modalPrice = modal.querySelector('[data-room-modal-price]');
  const mediaBox = modal.querySelector('.room-modal__detailsMedia');
  const heroImg = modal.querySelector('[data-room-modal-hero-img]');
  const heroIncoming = modal.querySelector('[data-room-modal-hero-incoming]');
  const counter = modal.querySelector('[data-room-modal-counter]');
  const metaBox = modal.querySelector('[data-room-modal-meta]');
  const descBox = modal.querySelector('[data-room-modal-desc]');
  const dotsBox = modal.querySelector('[data-room-modal-dots]');
  const prevButton = modal.querySelector('[data-room-modal-prev]');
  const nextButton = modal.querySelector('[data-room-modal-next]');
  const closeElements = modal.querySelectorAll('[data-room-modal-close]');
  const galleryLink = modal.querySelector('.room-modal__galleryLink');

  /* Полноэкранный просмотр текущей фотографии по нажатию на неё. */
  const fullscreen = modal.querySelector('[data-room-fs]');
  const fullscreenStage = modal.querySelector('[data-room-fs-stage]');
  const fullscreenImg = modal.querySelector('[data-room-fs-img]');
  const fullscreenIncoming = modal.querySelector('[data-room-fs-incoming]');
  const fullscreenCloseElements = modal.querySelectorAll('[data-room-fs-close]');
  const fullscreenPrev = modal.querySelector('[data-room-fs-prev]');
  const fullscreenNext = modal.querySelector('[data-room-fs-next]');

  let images = [];
  let activeIndex = 0;
  let touchStartX = 0;
  let touchStartY = 0;
  let touchDeltaX = 0;
  let isHorizontalSwipe = false;
  let suppressImageClick = false;
  let hasRenderedImage = false;
  let imageTransitionId = 0;
  let fullscreenTransitionId = 0;
  let fullscreenTouchStartX = 0;
  let fullscreenTouchStartY = 0;
  let fullscreenTouchDeltaX = 0;
  let isFullscreenHorizontalSwipe = false;
  let fullscreenScale = 1;
  let fullscreenPanX = 0;
  let fullscreenPanY = 0;
  let fullscreenPinchStartDistance = 0;
  let fullscreenPinchStartScale = 1;
  let fullscreenPanStartX = 0;
  let fullscreenPanStartY = 0;
  let fullscreenPanOriginX = 0;
  let fullscreenPanOriginY = 0;
  let fullscreenIsPinching = false;
  let fullscreenIsPanning = false;
  let fullscreenGestureMoved = false;
  let fullscreenLastTap = 0;

  const isModalOpen = () => modal.classList.contains('is-open');
  const isFullscreenOpen = () => {
    return Boolean(fullscreen && fullscreen.classList.contains('is-open'));
  };

  const nextIndex = () => (activeIndex + 1) % Math.max(1, images.length);
  const prevIndex = () => (activeIndex - 1 + images.length) % Math.max(1, images.length);

  const renderDots = () => {
    if (!dotsBox) return;
    dotsBox.innerHTML = '';

    images.forEach((_, index) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = `room-modal__dot${index === activeIndex ? ' is-active' : ''}`;
      dot.setAttribute('aria-label', `Показать фото ${index + 1}`);
      dot.addEventListener('click', () => showImage(index));
      dotsBox.appendChild(dot);
    });
  };

  const updateActiveDot = () => {
    if (!dotsBox) return;

    dotsBox.querySelectorAll('.room-modal__dot').forEach((dot, index) => {
      dot.classList.toggle('is-active', index === activeIndex);
    });
  };

  const updateCounter = () => {
    if (!counter) return;
    counter.textContent = `${activeIndex + 1} / ${Math.max(1, images.length)}`;
  };

  /*
    Настоящий crossfade: новый кадр проявляется вторым слоем поверх старого.
    После завершения основной слой обновляется незаметно.
  */
  const crossfadeImage = (main, incoming, src, transitionId, getCurrentId) => {
    if (!main || !incoming || !src) return;

    const loader = new Image();
    loader.src = src;

    const reveal = () => {
      if (transitionId !== getCurrentId()) return;

      /*
        Сначала мгновенно прячем служебный слой, затем проявляем его
        в следующем кадре. Это сохраняет crossfade даже при быстрых свайпах.
      */
      incoming.classList.add('no-transition');
      incoming.classList.remove('is-visible');
      incoming.src = src;

      window.requestAnimationFrame(() => {
        incoming.classList.remove('no-transition');

        window.requestAnimationFrame(() => {
          if (transitionId !== getCurrentId()) return;
          incoming.classList.add('is-visible');

          window.setTimeout(() => {
            if (transitionId !== getCurrentId()) return;

            main.src = src;
            incoming.classList.add('no-transition');
            incoming.classList.remove('is-visible');

            window.requestAnimationFrame(() => {
              incoming.classList.remove('no-transition');
            });
          }, 260);
        });
      });
    };

    if (loader.complete) {
      reveal();
    } else {
      loader.onload = reveal;
      loader.onerror = reveal;
    }
  };

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const applyFullscreenZoom = () => {
    if (!fullscreenStage) return;

    fullscreenStage.style.transform =
      `translate3d(${fullscreenPanX}px, ${fullscreenPanY}px, 0) ` +
      `scale(${fullscreenScale})`;

    fullscreen.classList.toggle('is-zoomed', fullscreenScale > 1.01);
  };

  const resetFullscreenZoom = () => {
    fullscreenScale = 1;
    fullscreenPanX = 0;
    fullscreenPanY = 0;
    applyFullscreenZoom();
  };

  const clampFullscreenPan = () => {
    const maxX = (window.innerWidth * (fullscreenScale - 1)) / 2;
    const maxY = (window.innerHeight * (fullscreenScale - 1)) / 2;
    fullscreenPanX = clamp(fullscreenPanX, -maxX, maxX);
    fullscreenPanY = clamp(fullscreenPanY, -maxY, maxY);
  };

  const touchDistance = (first, second) => {
    return Math.hypot(
      second.clientX - first.clientX,
      second.clientY - first.clientY
    );
  };

  const renderFullscreenImage = () => {
    if (!fullscreenImg || !images[activeIndex]) return;

    resetFullscreenZoom();

    if (!fullscreenImg.getAttribute('src')) {
      fullscreenImg.src = images[activeIndex];
      return;
    }

    const transitionId = ++fullscreenTransitionId;
    crossfadeImage(
      fullscreenImg,
      fullscreenIncoming,
      images[activeIndex],
      transitionId,
      () => fullscreenTransitionId
    );
  };

  const showImage = (index) => {
    if (!images[index]) return;

    activeIndex = index;
    if (heroImg) {
      if (!hasRenderedImage) {
        heroImg.src = images[activeIndex];
        hasRenderedImage = true;
      } else {
        const transitionId = ++imageTransitionId;
        crossfadeImage(
          heroImg,
          heroIncoming,
          images[activeIndex],
          transitionId,
          () => imageTransitionId
        );
      }
    }
    updateActiveDot();
    updateCounter();

    if (isFullscreenOpen()) renderFullscreenImage();
  };

  const openFullscreen = () => {
    if (!fullscreen || !fullscreenImg || !images.length) return;

    renderFullscreenImage();
    fullscreen.classList.add('is-open');
    fullscreen.setAttribute('aria-hidden', 'false');
    resetFullscreenZoom();
  };

  const closeFullscreen = () => {
    if (!fullscreen || !fullscreenImg) return;

    fullscreen.classList.remove('is-open');
    fullscreen.setAttribute('aria-hidden', 'true');
    fullscreenImg.src = '';
    if (fullscreenIncoming) {
      fullscreenIncoming.src = '';
      fullscreenIncoming.classList.remove('is-visible', 'no-transition');
    }
    resetFullscreenZoom();
  };

  const openModal = () => {
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');

    /*
      На мобильном браузере скролл панели всегда начинается сверху,
      поэтому название и кнопка закрытия сразу видны.
    */
    const scrollArea = modal.querySelector('.room-modal__page--details');
    if (scrollArea) scrollArea.scrollTop = 0;
  };

  const closeModal = () => {
    closeFullscreen();
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');

    images = [];
    activeIndex = 0;
    hasRenderedImage = false;
    imageTransitionId += 1;
    fullscreenTransitionId += 1;

    if (heroImg) heroImg.src = '';
    if (heroIncoming) {
      heroIncoming.src = '';
      heroIncoming.classList.remove('is-visible', 'no-transition');
    }
    if (metaBox) metaBox.innerHTML = '';
    if (descBox) descBox.innerHTML = '';
    if (dotsBox) dotsBox.innerHTML = '';
  };

  const fillModal = ({ title, price, metaHtml, descHtml, imageList }) => {
    images = imageList;
    activeIndex = 0;
    hasRenderedImage = false;

    /* Заранее загружаем кадры, чтобы первый свайп не ждал сеть. */
    imageList.forEach((src) => {
      const preload = new Image();
      preload.src = src;
    });

    if (modalTitle) modalTitle.textContent = title || 'НОМЕР';
    if (modalPrice) modalPrice.textContent = price || '';
    if (metaBox) metaBox.innerHTML = metaHtml || '';
    if (descBox) descBox.innerHTML = descHtml || '';

    renderDots();
    showImage(0);
  };

  if (prevButton) {
    prevButton.addEventListener('click', () => showImage(prevIndex()));
  }

  if (nextButton) {
    nextButton.addEventListener('click', () => showImage(nextIndex()));
  }

  if (heroImg) {
    heroImg.addEventListener('click', () => {
      if (suppressImageClick) {
        suppressImageClick = false;
        return;
      }
      openFullscreen();
    });
  }

  if (fullscreenPrev) {
    fullscreenPrev.addEventListener('click', () => showImage(prevIndex()));
  }

  if (fullscreenNext) {
    fullscreenNext.addEventListener('click', () => showImage(nextIndex()));
  }

  /*
    Жесты полноэкранного просмотра:
    - один палец при масштабе 1× — перелистывание;
    - два пальца — pinch-to-zoom до 4×;
    - один палец при увеличении — перемещение фотографии;
    - двойной тап — увеличение 2× или сброс.
  */
  if (fullscreen) {
    fullscreen.addEventListener(
      'touchstart',
      (event) => {
        fullscreenGestureMoved = false;

        if (event.touches.length === 2) {
          fullscreenIsPinching = true;
          fullscreenIsPanning = false;
          fullscreenPinchStartDistance = touchDistance(
            event.touches[0],
            event.touches[1]
          );
          fullscreenPinchStartScale = fullscreenScale;
          return;
        }

        const touch = event.touches[0];
        if (!touch) return;
        fullscreenTouchStartX = touch.clientX;
        fullscreenTouchStartY = touch.clientY;
        fullscreenTouchDeltaX = 0;
        isFullscreenHorizontalSwipe = false;

        if (fullscreenScale > 1.01) {
          fullscreenIsPanning = true;
          fullscreenPanStartX = touch.clientX;
          fullscreenPanStartY = touch.clientY;
          fullscreenPanOriginX = fullscreenPanX;
          fullscreenPanOriginY = fullscreenPanY;
        }
      },
      { passive: false }
    );

    fullscreen.addEventListener(
      'touchmove',
      (event) => {
        if (event.touches.length === 2 && fullscreenIsPinching) {
          const distance = touchDistance(event.touches[0], event.touches[1]);
          const ratio = distance / Math.max(1, fullscreenPinchStartDistance);

          fullscreenScale = clamp(
            fullscreenPinchStartScale * ratio,
            1,
            4
          );
          clampFullscreenPan();
          applyFullscreenZoom();
          fullscreenGestureMoved = true;
          event.preventDefault();
          return;
        }

        const touch = event.touches[0];
        if (!touch) return;

        if (fullscreenScale > 1.01 && fullscreenIsPanning) {
          fullscreenPanX =
            fullscreenPanOriginX + touch.clientX - fullscreenPanStartX;
          fullscreenPanY =
            fullscreenPanOriginY + touch.clientY - fullscreenPanStartY;
          clampFullscreenPan();
          applyFullscreenZoom();
          fullscreenGestureMoved = true;
          event.preventDefault();
          return;
        }

        const deltaX = touch.clientX - fullscreenTouchStartX;
        const deltaY = touch.clientY - fullscreenTouchStartY;
        fullscreenTouchDeltaX = deltaX;

        if (Math.abs(deltaX) > 10 && Math.abs(deltaX) > Math.abs(deltaY)) {
          isFullscreenHorizontalSwipe = true;
          fullscreenGestureMoved = true;
          event.preventDefault();
        }
      },
      { passive: false }
    );

    fullscreen.addEventListener('touchend', (event) => {
      if (event.touches.length > 0) return;

      if (
        fullscreenScale <= 1.01 &&
        isFullscreenHorizontalSwipe &&
        Math.abs(fullscreenTouchDeltaX) >= 46
      ) {
        if (fullscreenTouchDeltaX < 0) {
          showImage(nextIndex());
        } else {
          showImage(prevIndex());
        }
      }

      if (!fullscreenGestureMoved && !fullscreenIsPinching) {
        const now = Date.now();

        if (now - fullscreenLastTap < 300) {
          if (fullscreenScale > 1.01) {
            resetFullscreenZoom();
          } else {
            fullscreenScale = 2;
            applyFullscreenZoom();
          }
          fullscreenLastTap = 0;
        } else {
          fullscreenLastTap = now;
        }
      }

      if (fullscreenScale <= 1.01) resetFullscreenZoom();

      fullscreenTouchDeltaX = 0;
      isFullscreenHorizontalSwipe = false;
      fullscreenIsPinching = false;
      fullscreenIsPanning = false;
      fullscreenGestureMoved = false;
    });

    fullscreen.addEventListener('touchcancel', () => {
      fullscreenTouchDeltaX = 0;
      isFullscreenHorizontalSwipe = false;
      fullscreenIsPinching = false;
      fullscreenIsPanning = false;
      fullscreenGestureMoved = false;
    });
  }

  /*
    Горизонтальный свайп внутри фотоблока.
    Вертикальный жест остаётся свободным для прокрутки информации.
  */
  if (mediaBox) {
    mediaBox.addEventListener(
      'touchstart',
      (event) => {
        const touch = event.touches[0];
        if (!touch) return;

        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        touchDeltaX = 0;
        isHorizontalSwipe = false;
        mediaBox.classList.add('is-touching');
      },
      { passive: true }
    );

    mediaBox.addEventListener(
      'touchmove',
      (event) => {
        const touch = event.touches[0];
        if (!touch) return;

        const deltaX = touch.clientX - touchStartX;
        const deltaY = touch.clientY - touchStartY;
        touchDeltaX = deltaX;

        if (Math.abs(deltaX) > 10 && Math.abs(deltaX) > Math.abs(deltaY)) {
          isHorizontalSwipe = true;
          event.preventDefault();
        }
      },
      { passive: false }
    );

    mediaBox.addEventListener('touchend', () => {
      mediaBox.classList.remove('is-touching');

      if (isHorizontalSwipe && Math.abs(touchDeltaX) >= 46) {
        suppressImageClick = true;

        if (touchDeltaX < 0) {
          showImage(nextIndex());
        } else {
          showImage(prevIndex());
        }

        window.setTimeout(() => {
          suppressImageClick = false;
        }, 350);
      }

      touchDeltaX = 0;
      isHorizontalSwipe = false;
    });

    mediaBox.addEventListener('touchcancel', () => {
      mediaBox.classList.remove('is-touching');
      touchDeltaX = 0;
      isHorizontalSwipe = false;
    });
  }
  fullscreenCloseElements.forEach((element) => {
    element.addEventListener('click', closeFullscreen);
  });

  closeElements.forEach((element) => {
    element.addEventListener('click', closeModal);
  });

  /*
    Общая галерея открывается своим gallery.js.
    Здесь мы только закрываем модалку номера, чтобы галерея не оказалась
    под ней и чтобы хедер/скролл вернулись в нормальное состояние.
  */
  if (galleryLink) {
    galleryLink.addEventListener('click', closeModal);
  }

  /*
    Escape сначала закрывает полноэкранное фото,
    а повторное нажатие — саму модалку.
  */
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;

    if (isFullscreenOpen()) {
      closeFullscreen();
    } else if (isModalOpen()) {
      closeModal();
    }
  });

  /* Открываем модалку по нажатию на карточку номера. */
  document.querySelectorAll('.room-slide[data-images]').forEach((card) => {
    card.addEventListener('click', () => {
      const nameElement = card.querySelector('.room-name');
      const priceElement = card.querySelector('.room-price');
      const metaElement = card.querySelector('.room-meta');
      const shortDescriptionElement = card.querySelector('.room-desc');
      const fullDescriptionElement = card.querySelector('.room-desc-full');

      const title =
        card.getAttribute('data-room-title') ||
        (nameElement && nameElement.textContent
          ? nameElement.textContent.trim()
          : '') ||
        'НОМЕР';

      const price =
        card.getAttribute('data-room-price') ||
        (priceElement && priceElement.textContent
          ? priceElement.textContent.trim()
          : '') ||
        '';

      const imageList = (card.getAttribute('data-images') || '')
        .split(',')
        .map((src) => src.trim())
        .filter(Boolean);

      if (!imageList.length) return;

      const metaHtml = metaElement ? metaElement.innerHTML : '';
      const shortDescription =
        shortDescriptionElement && shortDescriptionElement.textContent
          ? shortDescriptionElement.textContent.trim()
          : '';
      const fullDescription = fullDescriptionElement
        ? fullDescriptionElement.innerHTML.trim()
        : '';

      fillModal({
        title,
        price,
        metaHtml,
        descHtml: fullDescription || shortDescription,
        imageList,
      });

      openModal();
    });
  });
});
