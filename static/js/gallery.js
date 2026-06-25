document.addEventListener('DOMContentLoaded', () => {
  const gallery = document.querySelector('[data-site-gallery]');
  if (!gallery) return;

  const openButtons = document.querySelectorAll('[data-site-gallery-open]');
  const closeButtons = gallery.querySelectorAll('[data-site-gallery-close]');
  const thumbs = Array.from(gallery.querySelectorAll('[data-site-gallery-thumb]'));
  const filters = Array.from(gallery.querySelectorAll('[data-site-gallery-section]'));
  const preview = gallery.querySelector('[data-site-gallery-preview]');
  const caption = gallery.querySelector('[data-site-gallery-caption]');

  const showPhoto = (thumb) => {
    if (!thumb || !preview) return;
    preview.src = thumb.dataset.siteGallerySrc;
    preview.alt = thumb.querySelector('img')?.alt || 'Фото ресторана Oromsoy Resort';
    if (caption) caption.textContent = thumb.dataset.siteGalleryCaption || '';
    thumbs.forEach(item => item.classList.toggle('is-active', item === thumb));
  };

  const applySection = (section = 'all') => {
    const activeFilter = filters.find(filter => filter.dataset.siteGallerySection === section) || filters[0];
    if (!activeFilter) return;

    filters.forEach(item => item.classList.toggle('is-active', item === activeFilter));
    thumbs.forEach(thumb => {
      const visible = activeFilter.dataset.siteGallerySection === 'all' || thumb.dataset.siteGalleryCategory === activeFilter.dataset.siteGallerySection;
      thumb.hidden = !visible;
    });
  };

  const openGallery = (index = 0, section = 'all') => {
    gallery.classList.add('is-open');
    gallery.setAttribute('aria-hidden', 'false');
    document.body.classList.add('site-gallery-opened');
    applySection(section);
    showPhoto(thumbs.filter(thumb => !thumb.hidden)[index] || thumbs.find(thumb => !thumb.hidden));
  };

  const closeGallery = () => {
    gallery.classList.remove('is-open');
    gallery.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('site-gallery-opened');
  };

  openButtons.forEach(button => {
    button.addEventListener('click', () => openGallery(Number(button.dataset.siteGalleryIndex || 0), button.dataset.siteGallerySection || 'all'));
  });

  closeButtons.forEach(button => button.addEventListener('click', closeGallery));

  thumbs.forEach(thumb => {
    thumb.addEventListener('click', () => showPhoto(thumb));
  });

  filters.forEach(filter => {
    filter.addEventListener('click', () => {
      const category = filter.dataset.siteGallerySection;
      applySection(category);
      showPhoto(thumbs.find(thumb => !thumb.hidden));
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && gallery.classList.contains('is-open')) closeGallery();
  });
});