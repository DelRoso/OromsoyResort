document.addEventListener('DOMContentLoaded', () => {
  const header = document.getElementById('siteHeader');
  if (!header) return;

  const burger = header.querySelector('.menu-toggle');
  const closeBtn = header.querySelector('.menu-close');
  const mobileMenu = header.querySelector('.mobile-menu');

  // ===== Header scroll state =====
  const toggleHeader = () => {
    if (window.scrollY > 40) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  };

  // ===== Mobile menu open/close =====
  const openMenu = () => {
    if (!burger || !mobileMenu) return;

    header.classList.add('menu-open');
    document.body.classList.add('menu-open');

    burger.setAttribute('aria-expanded', 'true');
    mobileMenu.setAttribute('aria-hidden', 'false');
  };

  const closeMenu = () => {
    if (!burger || !mobileMenu) return;

    header.classList.remove('menu-open');
    document.body.classList.remove('menu-open');

    burger.setAttribute('aria-expanded', 'false');
    mobileMenu.setAttribute('aria-hidden', 'true');
  };

  const toggleMenu = () => {
    if (header.classList.contains('menu-open')) closeMenu();
    else openMenu();
  };

  // Click handlers
  if (burger) {
    burger.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleMenu();
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      closeMenu();
    });
  }

  // Close on ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });

  // Close when clicking a link inside mobile menu (and smooth scroll)
  const allNavLinks = header.querySelectorAll('a[href^="#"]');
  allNavLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (!href || href === '#') return;

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();

      const offset = header.offsetHeight || 0;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;

      window.scrollTo({ top, behavior: 'smooth' });
      closeMenu();
    });
  });

  // Init + listeners
  window.addEventListener('scroll', toggleHeader, { passive: true });
  window.addEventListener('load', toggleHeader);
  toggleHeader();
});
