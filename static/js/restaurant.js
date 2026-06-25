document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.dining-photo-slider').forEach((slider) => {
    const images = [...slider.querySelectorAll('.dining-photo-slider__track img')];
    const dotsBox = slider.querySelector('.dining-photo-slider__dots');
    const prev = slider.querySelector('.dining-photo-slider__arrow--prev');
    const next = slider.querySelector('.dining-photo-slider__arrow--next');

    let current = 0;
    let autoplayId;

    const dots = images.map((_, index) => {
      const dot = document.createElement('button');

      dot.type = 'button';
      dot.className = 'dining-photo-slider__dot';
      dot.setAttribute('aria-label', `Фото ${index + 1}`);

      dot.addEventListener('click', () => {
        show(index);
        restartAutoplay();
      });

      dotsBox.appendChild(dot);
      return dot;
    });

    function show(index) {
      current = (index + images.length) % images.length;

      images.forEach((img, i) => {
        img.classList.toggle('is-active', i === current);
      });

      dots.forEach((dot, i) => {
        dot.classList.toggle('is-active', i === current);
      });
    }

    function startAutoplay() {
      autoplayId = setInterval(() => {
        show(current + 1);
      }, 3000);
    }

    function stopAutoplay() {
      clearInterval(autoplayId);
    }

    function restartAutoplay() {
      stopAutoplay();
      startAutoplay();
    }

    prev.addEventListener('click', () => {
      show(current - 1);
      restartAutoplay();
    });

    next.addEventListener('click', () => {
      show(current + 1);
      restartAutoplay();
    });

    slider.addEventListener('mouseenter', stopAutoplay);
    slider.addEventListener('mouseleave', startAutoplay);

    slider.addEventListener('focusin', stopAutoplay);
    slider.addEventListener('focusout', startAutoplay);

    show(0);
    startAutoplay();
  });
});