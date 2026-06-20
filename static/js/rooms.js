document.addEventListener('DOMContentLoaded', () => {
  /* =========================
     SLIDERS
  ========================= */
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

    prev.addEventListener('click', () => track.scrollBy({ left: -getCardWidth(), behavior: 'smooth' }));
    next.addEventListener('click', () => track.scrollBy({ left: getCardWidth(), behavior: 'smooth' }));
  });

  /* =========================
     MODAL
  ========================= */
  const modal = document.querySelector('[data-room-modal]');
  if (!modal) return;

  const modalTitle = modal.querySelector('[data-room-modal-title]');
  const modalPriceEls = modal.querySelectorAll('[data-room-modal-price]');
  const modalTrack = modal.querySelector('[data-room-modal-track]');
  const dotsEls = modal.querySelectorAll('[data-room-modal-dots]');
  const modalPrevBtns = modal.querySelectorAll('[data-room-modal-prev]');
  const modalNextBtns = modal.querySelectorAll('[data-room-modal-next]');
  const closeEls = modal.querySelectorAll('[data-room-modal-close]');

  const pageDetails = modal.querySelector('[data-room-modal-page="details"]');
  const pageGallery = modal.querySelector('[data-room-modal-page="gallery"]');

  const heroImg = modal.querySelector('[data-room-modal-hero-img]');
  const metaBox = modal.querySelector('[data-room-modal-meta]');
  const descBox = modal.querySelector('[data-room-modal-desc]');

  const btnOpenGallery = modal.querySelector('[data-room-modal-open-gallery]');
  const btnBackDetails = modal.querySelector('[data-room-modal-back-details]');

  // fullscreen
  const fs = modal.querySelector('[data-room-fs]');
  const fsImg = modal.querySelector('[data-room-fs-img]');
  const fsCloseEls = modal.querySelectorAll('[data-room-fs-close]');
  const fsPrev = modal.querySelector('[data-room-fs-prev]');
  const fsNext = modal.querySelector('[data-room-fs-next]');

  let slides = [];
  let activeIndex = 0;

  // autoplay only in gallery
  const AUTOPLAY_MS = 1000;
  const RESUME_IDLE_MS = 1500;
  let autoplayInterval = null;
  let resumeTimeout = null;
  let userPaused = false;

  const isOpen = () => modal.classList.contains('is-open');
  const isFsOpen = () => fs && fs.classList.contains('is-open');
  const isGalleryMode = () => pageGallery && pageGallery.classList.contains('is-active');

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

  const markUserInteraction = () => {
    userPaused = true;
    stopAutoplay(false);

    window.clearTimeout(resumeTimeout);
    resumeTimeout = window.setTimeout(() => {
      userPaused = false;
      if (isOpen() && isGalleryMode()) startAutoplay();
    }, RESUME_IDLE_MS);
  };

  const startAutoplay = () => {
    if (!isGalleryMode()) return;
    if (autoplayInterval || slides.length <= 1) return;
    if (userPaused) return;

    autoplayInterval = window.setInterval(() => {
      if (!isOpen() || !isGalleryMode()) return;
      scrollToIndex(nextIndex(), 'smooth');
    }, AUTOPLAY_MS);
  };

  const showDetails = () => {
    pageGallery?.classList.remove('is-active');
    pageDetails?.classList.add('is-active');
    stopAutoplay(false);

    // чтобы не "торчал край" галереи
    if (modalTrack) {
      modalTrack.style.pointerEvents = 'none';
      modalTrack.style.overflowX = 'hidden';
      modalTrack.scrollLeft = 0;
    }
  };

  const showGallery = () => {
    pageDetails?.classList.remove('is-active');
    pageGallery?.classList.add('is-active');

    if (modalTrack) {
      modalTrack.style.pointerEvents = '';
      modalTrack.style.overflowX = 'auto';
    }

    if (isOpen()) startAutoplay();
  };

  btnOpenGallery?.addEventListener('click', showGallery);
  btnBackDetails?.addEventListener('click', showDetails);

  const openModal = () => {
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    showDetails();
  };

  const closeFullscreen = () => {
    if (!fs || !fsImg) return;
    fs.classList.remove('is-open');
    fs.setAttribute('aria-hidden', 'true');
    fsImg.src = '';
  };

  const closeModal = () => {
    stopAutoplay(true);
    closeFullscreen();

    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');

    if (modalTrack) modalTrack.innerHTML = '';
    dotsEls.forEach((d) => (d.innerHTML = ''));

    slides = [];
    activeIndex = 0;
    userPaused = false;

    if (heroImg) heroImg.src = '';
    if (metaBox) metaBox.innerHTML = '';
    if (descBox) descBox.innerHTML = '';
  };

  const renderFs = () => {
    if (!fs || !fsImg) return;
    const imgEl = slides[activeIndex]?.querySelector('img') || heroImg;
    if (!imgEl) return;
    fsImg.src = imgEl.src;
  };

  const openFullscreen = () => {
    if (!fs || !fsImg) return;
    fs.classList.add('is-open');
    fs.setAttribute('aria-hidden', 'false');
    renderFs();
  };

  fsCloseEls.forEach((el) => el.addEventListener('click', closeFullscreen));

  const buildDots = (count) => {
    dotsEls.forEach((wrap) => {
      wrap.innerHTML = '';
      for (let i = 0; i < count; i++) {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'room-modal__dot' + (i === 0 ? ' is-active' : '');
        dot.addEventListener('click', () => {
          markUserInteraction();
          scrollToIndex(i);
        });
        wrap.appendChild(dot);
      }
    });
  };

  const setActiveDot = (idx) => {
    dotsEls.forEach((wrap) => {
      const dots = wrap.querySelectorAll('.room-modal__dot');
      dots.forEach((d, i) => d.classList.toggle('is-active', i === idx));
    });
  };

  const scrollToIndex = (idx, behavior = 'smooth') => {
    if (!slides[idx]) return;
    activeIndex = idx;
    setActiveDot(idx);

    const imgEl = slides[idx].querySelector('img');
    if (heroImg && imgEl) heroImg.src = imgEl.src;

    if (isGalleryMode() && modalTrack) {
      modalTrack.scrollTo({ left: slides[idx].offsetLeft, behavior });
    }

    if (isFsOpen()) renderFs();
  };

  const nextIndex = () => (activeIndex + 1) % Math.max(1, slides.length);
  const prevIndex = () => (activeIndex - 1 + slides.length) % Math.max(1, slides.length);

  const rebuildModal = ({ title, price, metaHtml, descHtml, images }) => {
    modalTitle.textContent = title || 'ROOM';
    modalPriceEls.forEach((el) => (el.textContent = price || ''));

    if (metaBox) metaBox.innerHTML = metaHtml || '';
    if (descBox) descBox.innerHTML = descHtml || '';

    modalTrack.innerHTML = '';
    slides = [];

    images.forEach((src) => {
      const slide = document.createElement('div');
      slide.className = 'room-modal__img';
      slide.innerHTML = `<img src="${src}" alt="${title || 'Room photo'}">`;

      slide.querySelector('img').addEventListener('click', (e) => {
        e.stopPropagation();
        markUserInteraction();
        openFullscreen();
      });

      modalTrack.appendChild(slide);
      slides.push(slide);
    });

    buildDots(images.length);

    activeIndex = 0;
    setActiveDot(0);

    if (heroImg) {
      heroImg.src = images[0] || '';
      heroImg.onclick = (e) => {
        e.stopPropagation();
        markUserInteraction();
        openFullscreen();
      };
    }

    userPaused = false;
    stopAutoplay(true);

    modalTrack.scrollTo({ left: 0, behavior: 'auto' });
    showDetails();
  };

  // prev/next buttons
  modalPrevBtns.forEach((btn) => btn.addEventListener('click', () => { markUserInteraction(); scrollToIndex(prevIndex()); }));
  modalNextBtns.forEach((btn) => btn.addEventListener('click', () => { markUserInteraction(); scrollToIndex(nextIndex()); }));

  // fullscreen prev/next
  fsPrev?.addEventListener('click', () => { markUserInteraction(); scrollToIndex(prevIndex()); renderFs(); });
  fsNext?.addEventListener('click', () => { markUserInteraction(); scrollToIndex(nextIndex()); renderFs(); });

  // close modal
  closeEls.forEach((el) => el.addEventListener('click', closeModal));

  // open modal from card
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

      const images = (card.getAttribute('data-images') || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (!images.length) return;

      const metaHtml = card.querySelector('.room-meta')?.innerHTML || '';
      const shortDesc = card.querySelector('.room-desc')?.textContent?.trim() || '';

      const fullEl = card.querySelector('.room-desc-full');
      const fullHtml = fullEl ? fullEl.innerHTML.trim() : '';

      const descHtml = fullHtml || shortDesc;

      rebuildModal({ title, price, metaHtml, descHtml, images });
      openModal();
    });
  });
});
