document.addEventListener('DOMContentLoaded', () => {
  const toast = document.querySelector('[data-toast]');
  const copyLinks = document.querySelectorAll('[data-copy]');
  const openMapBtn = document.querySelector('[data-open-map]');

  // Точные координаты
  const LAT = 41.507893978033906;
  const LNG = 69.95175481365118;

  const showToast = (text) => {
    if (!toast) return;

    toast.textContent = text;
    toast.style.display = 'inline-block';

    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => {
      toast.style.display = 'none';
    }, 2200);
  };

  const copyToClipboard = async (value) => {
    const text = String(value || '').trim();
    if (!text) return;

    try {
      // modern
      await navigator.clipboard.writeText(text);
      showToast('Copied!');
    } catch (err) {
      // fallback
      const temp = document.createElement('textarea');
      temp.value = text;
      temp.setAttribute('readonly', '');
      temp.style.position = 'fixed';
      temp.style.left = '-9999px';
      temp.style.top = '0';
      document.body.appendChild(temp);
      temp.select();
      document.execCommand('copy');
      document.body.removeChild(temp);
      showToast('Copied!');
    }
  };

  // copy links
  copyLinks.forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const value = a.getAttribute('data-copy') || '';
      copyToClipboard(value);
    });
  });

  // open map button
  if (openMapBtn) {
    openMapBtn.addEventListener('click', (e) => {
      e.preventDefault();

      // Открываем сразу по координатам (самый стабильный вариант)
      const url = `https://www.google.com/maps?q=${LAT},${LNG}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    });
  }
});
