

document.addEventListener('click', (e) => {
  const btn = e.target.closest('.js-toggle-password');
  if (!btn) return;

  const wrapper = btn.closest('.auth__password-wrapper');
  if (!wrapper) return;

  const input = wrapper.querySelector('.js-password');
  if (!input) return;

  const isHidden = input.getAttribute('type') === 'password';
  input.setAttribute('type', isHidden ? 'text' : 'password');

  btn.classList.toggle('is-visible', isHidden);


});
