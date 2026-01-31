const header = document.getElementById('siteHeader');
const burger = document.querySelector('.menu-toggle');
const closeBtn = document.querySelector('.menu-close');
const mobileMenu = document.querySelector('.mobile-menu');

const toggleHeader = () => {
  if (!header) return;
  if (window.scrollY > 40) header.classList.add('scrolled');
  else header.classList.remove('scrolled');
};

const openMenu = () => {
  if (!header || !burger || !mobileMenu) return;
  header.classList.add('menu-open');
  document.body.classList.add('menu-open');
  burger.setAttribute('aria-expanded', 'true');
  mobileMenu.setAttribute('aria-hidden', 'false');
};

const closeMenu = () => {
  if (!header || !burger || !mobileMenu) return;
  header.classList.remove('menu-open');
  document.body.classList.remove('menu-open');
  burger.setAttribute('aria-expanded', 'false');
  mobileMenu.setAttribute('aria-hidden', 'true');
};

const toggleMenu = () => {
  if (!header) return;
  if (header.classList.contains('menu-open')) closeMenu();
  else openMenu();
};

if (burger) {
  burger.addEventListener('click', (e) => {
    e.preventDefault();
    toggleMenu();
  });
}

if (closeBtn) {
  closeBtn.addEventListener('click', (e) => {
    e.preventDefault();
    closeMenu();
  });
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeMenu();
});

// smooth anchors + close on click
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    const targetId = link.getAttribute('href');
    if (!targetId || targetId === '#') return;

    const target = document.querySelector(targetId);
    if (!target) return;

    event.preventDefault();

    const offset = header ? header.offsetHeight : 0;
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });

    closeMenu();
  });
});

window.addEventListener('scroll', toggleHeader, { passive: true });
window.addEventListener('load', toggleHeader);
