(() => {
  const header = document.querySelector('.header');
  if (!header) return;

  const burger = header.querySelector('.header__burger');
  const mobilePanel = header.querySelector('.header__mobile');

  if (!burger || !mobilePanel) return;

  const closeMobile = () => {
    mobilePanel.hidden = true;
    burger.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('no-scroll');
  };

  const openMobile = () => {
    mobilePanel.hidden = false;
    burger.setAttribute('aria-expanded', 'true');
    document.body.classList.add('no-scroll');
  };

  burger.addEventListener('click', () => {
    const expanded = burger.getAttribute('aria-expanded') === 'true';
    expanded ? closeMobile() : openMobile();
  });

  // Close on link click
  mobilePanel.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (link) closeMobile();
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMobile();
  });

  // If resize to desktop — just close
  const mq = window.matchMedia('(max-width: 900px)');
  const onMqChange = () => {
    if (!mq.matches) closeMobile();
  };
  mq.addEventListener?.('change', onMqChange);
  onMqChange();
})();
