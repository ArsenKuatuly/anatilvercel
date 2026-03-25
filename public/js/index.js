
(function () {
  const body = document.body;
  const menuButton = document.querySelector('.menu-toggle');
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileOverlay = document.querySelector('.mobile-overlay');
  const mobileLinks = document.querySelectorAll('.mobile-menu__link');

  function openMenu() {
    if (!menuButton || !mobileMenu || !mobileOverlay) return;
    mobileMenu.hidden = false;
    mobileOverlay.hidden = false;
    menuButton.classList.add('is-open');
    menuButton.setAttribute('aria-expanded', 'true');
    body.classList.add('is-menu-open');
  }

  function closeMenu() {
    if (!menuButton || !mobileMenu || !mobileOverlay) return;
    mobileMenu.hidden = true;
    mobileOverlay.hidden = true;
    menuButton.classList.remove('is-open');
    menuButton.setAttribute('aria-expanded', 'false');
    body.classList.remove('is-menu-open');
  }

  if (menuButton) {
    menuButton.addEventListener('click', function () {
      if (mobileMenu.hidden) openMenu();
      else closeMenu();
    });
  }

  if (mobileOverlay) mobileOverlay.addEventListener('click', closeMenu);
  mobileLinks.forEach(function (link) { link.addEventListener('click', closeMenu); });
  window.addEventListener('resize', function () { if (window.innerWidth >= 1024) closeMenu(); });
  document.addEventListener('keydown', function (event) { if (event.key === 'Escape') closeMenu(); });

  const langButtons = document.querySelectorAll('.lang-toggle');
  langButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      const value = button.querySelector('.lang-toggle__value');
      if (!value) return;
      value.textContent = value.textContent.trim() === 'RU' ? 'KZ' : 'RU';
      langButtons.forEach(function (other) {
        const otherValue = other.querySelector('.lang-toggle__value');
        if (otherValue) otherValue.textContent = value.textContent;
      });
    });
  });

  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(function (item) {
    const button = item.querySelector('.faq-item__button');
    if (!button) return;
    button.addEventListener('click', function () {
      const isOpen = item.classList.contains('is-open');
      faqItems.forEach(function (other) { other.classList.remove('is-open'); });
      if (!isOpen) item.classList.add('is-open');
    });
  });
})();
