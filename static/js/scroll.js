const header = document.querySelector('.site-header');
const navLinks = document.querySelectorAll('a[href^="#"]');

const toggleHeader = () => {
  if (!header) return;
  if (window.scrollY > 40) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
};

navLinks.forEach((link) => {
  link.addEventListener('click', (event) => {
    const targetId = link.getAttribute('href');
    if (!targetId || targetId === '#') return;
    const target = document.querySelector(targetId);
    if (!target) return;
    event.preventDefault();
    const offset = header?.offsetHeight ?? 0;
    const targetPosition = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({
      top: targetPosition,
      behavior: 'smooth',
    });
  });
});

window.addEventListener('scroll', toggleHeader);
window.addEventListener('load', toggleHeader);
